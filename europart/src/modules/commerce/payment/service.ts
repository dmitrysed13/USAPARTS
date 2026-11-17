import "server-only";

import { randomUUID } from "node:crypto";
import { Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { writeAudit } from "@/modules/admin/audit";
import { resolvePaymentProvider } from "@/modules/commerce/payment/provider";
import type { PaymentIntentResult } from "@/modules/commerce/payment/types";
import { assertOrderStatusTransition } from "@/modules/commerce/order-status";

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export async function getPublicPaymentAvailability() {
  return resolvePaymentProvider().status();
}

export async function startOnlinePayment(input: {
  orderId: string;
  returnUrl: string;
}): Promise<PaymentIntentResult> {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) {
    throw new Error("Заказ не найден.");
  }
  if (order.checkoutMode !== "ONLINE") {
    return {
      state: "unavailable",
      message: "Этот заказ оформлен через менеджера. Онлайн-оплата для него не запускается.",
    };
  }

  const provider = resolvePaymentProvider();
  const status = provider.status();
  if (!status.configured) {
    return { state: "unavailable", message: status.message };
  }

  const idempotencyKey = `pay:${order.id}:${order.totalCents}`;
  const existing = await prisma.paymentTransaction.findUnique({
    where: { idempotencyKey },
  });
  if (existing?.status === "SUCCEEDED") {
    return {
      state: "unavailable",
      message: "Заказ уже отмечен как оплаченный провайдером. Клиентский «paid» не принимается.",
    };
  }

  const intent = await provider.createIntent({
    orderId: order.id,
    orderNumber: order.number,
    amountCents: order.totalCents,
    currency: order.currency.trim(),
    idempotencyKey,
    returnUrl: input.returnUrl,
  });

  if (intent.state === "unavailable") {
    return intent;
  }

  await prisma.paymentTransaction.upsert({
    where: { idempotencyKey },
    create: {
      orderId: order.id,
      provider: intent.provider,
      externalId: intent.externalId ?? null,
      status: "PENDING",
      amountCents: order.totalCents,
      currency: order.currency,
      idempotencyKey,
      metadata: json({ message: intent.message }),
    },
    update: {
      externalId: intent.externalId ?? undefined,
      status: "PENDING",
      metadata: json({ message: intent.message }),
    },
  });

  if (order.paymentState === "NOT_CONNECTED" || order.paymentState === "FAILED") {
    await prisma.order.update({
      where: { id: order.id },
      data: {
        paymentState: "AWAITING",
        paymentNote: intent.message,
      },
    });
  }

  return intent;
}

/**
 * Idempotent webhook handler. Signature must verify. Never trusts a browser "paid" flag.
 */
export async function handlePaymentWebhook(input: {
  rawBody: string;
  headers: Headers;
}): Promise<{ ok: boolean; message: string; duplicate?: boolean }> {
  const provider = resolvePaymentProvider();
  const status = provider.status();
  if (!status.configured) {
    return { ok: false, message: status.message };
  }

  const parsed = await provider.verifyAndParseWebhook(input);
  if (!parsed.handled) {
    await getPrismaClient().paymentWebhook.create({
      data: {
        provider: status.provider,
        eventId: `invalid:${randomUUID()}`,
        signatureValid: false,
        payload: json({ raw: input.rawBody.slice(0, 4000), reason: parsed.reason }),
        processed: false,
        processError: parsed.reason,
      },
    });
    return { ok: false, message: parsed.reason };
  }

  const prisma = getPrismaClient();
  const eventId = (() => {
    try {
      const body = JSON.parse(input.rawBody) as { eventId?: string };
      return body.eventId ?? randomUUID();
    } catch {
      return randomUUID();
    }
  })();

  const existingEvent = await prisma.paymentWebhook.findUnique({
    where: { provider_eventId: { provider: status.provider, eventId } },
  });
  if (existingEvent?.processed) {
    return { ok: true, message: "Событие уже обработано.", duplicate: true };
  }

  const order = parsed.orderNumber
    ? await prisma.order.findUnique({ where: { number: parsed.orderNumber } })
    : null;

  const tx = order
    ? await prisma.paymentTransaction.findFirst({
        where: { orderId: order.id },
        orderBy: { createdAt: "desc" },
      })
    : null;

  const webhook = existingEvent
    ? await prisma.paymentWebhook.update({
        where: { id: existingEvent.id },
        data: {
          signatureValid: true,
          payload: json(JSON.parse(input.rawBody)),
          transactionId: tx?.id ?? null,
        },
      })
    : await prisma.paymentWebhook.create({
        data: {
          provider: status.provider,
          eventId,
          signatureValid: true,
          payload: json(JSON.parse(input.rawBody)),
          transactionId: tx?.id ?? null,
        },
      });

  if (!order || !tx) {
    await prisma.paymentWebhook.update({
      where: { id: webhook.id },
      data: {
        processed: true,
        processedAt: new Date(),
        processError: "Заказ или транзакция не найдены.",
      },
    });
    return { ok: false, message: "Заказ или транзакция не найдены." };
  }

  await prisma.$transaction(async (client) => {
    await client.paymentTransaction.update({
      where: { id: tx.id },
      data: {
        status: parsed.transactionStatus,
        externalId: parsed.externalId ?? tx.externalId,
      },
    });

    if (parsed.transactionStatus === "SUCCEEDED") {
      if (order.status === "AWAITING_PAYMENT") {
        assertOrderStatusTransition("AWAITING_PAYMENT", "PAID");
        await client.order.update({
          where: { id: order.id },
          data: { status: "PAID", paymentState: "PAID", paymentNote: "Оплата подтверждена вебхуком провайдера." },
        });
        await client.orderStatusHistory.create({
          data: {
            orderId: order.id,
            fromStatus: order.status,
            toStatus: "PAID",
            actor: "payment-webhook",
            note: `event ${eventId}`,
          },
        });
      } else {
        await client.order.update({
          where: { id: order.id },
          data: { paymentState: "PAID", paymentNote: "Оплата подтверждена вебхуком провайдера." },
        });
      }
    } else if (parsed.transactionStatus === "FAILED") {
      await client.order.update({
        where: { id: order.id },
        data: { paymentState: "FAILED", paymentNote: "Оплата не прошла (вебхук провайдера)." },
      });
    } else if (parsed.transactionStatus === "REFUNDED") {
      await client.order.update({
        where: { id: order.id },
        data: { paymentState: "REFUNDED", paymentNote: "Возврат подтверждён вебхуком провайдера." },
      });
    }

    await client.paymentWebhook.update({
      where: { id: webhook.id },
      data: { processed: true, processedAt: new Date(), processError: null },
    });
  });

  await writeAudit({
    action: "payment.webhook",
    entityType: "Order",
    entityId: order.id,
    summary: `Вебхук оплаты ${parsed.transactionStatus} для ${order.number}.`,
  });

  return { ok: true, message: "Вебхук обработан.", duplicate: false };
}
