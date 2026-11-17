import "server-only";

import { randomBytes } from "node:crypto";
import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import {
  attributionToPrisma,
  buildAttributionSnapshot,
  type AttributionSnapshot,
} from "@/modules/analytics/attribution";
import type { CartLine } from "@/modules/commerce/cart-cookie";
import { resolveCartLines } from "@/modules/commerce/cart-service";
import { quoteDeliveryMethod } from "@/modules/commerce/delivery";
import { paymentProviderStatus } from "@/modules/commerce/payment/provider";
import { notifyOrderCreated } from "@/modules/notifications/order-notify";

const attributionSchema = z
  .object({
    utmSource: z.string().trim().max(80).optional().nullable(),
    utmMedium: z.string().trim().max(80).optional().nullable(),
    utmCampaign: z.string().trim().max(120).optional().nullable(),
    utmContent: z.string().trim().max(120).optional().nullable(),
    utmTerm: z.string().trim().max(120).optional().nullable(),
    firstTouchSource: z.string().trim().max(120).optional().nullable(),
    lastTouchSource: z.string().trim().max(120).optional().nullable(),
  })
  .optional();

const checkoutSchema = z.object({
  name: z.string().trim().min(2).max(120),
  phone: z.string().trim().min(5).max(40),
  email: z.union([z.literal(""), z.email()]).optional(),
  city: z.string().trim().max(80).optional(),
  address: z.string().trim().max(300).optional(),
  comment: z.string().trim().max(2000).optional(),
  deliveryMethodId: z.string().uuid(),
  checkoutMode: z.enum(["MANAGER", "ONLINE"]).default("MANAGER"),
  attribution: attributionSchema,
});

export type CheckoutInput = z.input<typeof checkoutSchema> & {
  lines: CartLine[];
  attributionCookies?: { first?: string | null; last?: string | null };
};

export type CheckoutResult = {
  orderId: string;
  number: string;
  accessToken: string;
  status: string;
  paymentState: string;
  checkoutMode: "MANAGER" | "ONLINE";
  totalCents: number;
  currency: "BYN";
  paymentMessage: string;
  onlinePaymentAvailable: boolean;
};

function yearPrefix(): string {
  return `EP-${new Date().getFullYear()}-`;
}

async function nextOrderNumber(tx: Prisma.TransactionClient): Promise<string> {
  const prefix = yearPrefix();
  const latest = await tx.order.findFirst({
    where: { number: { startsWith: prefix } },
    orderBy: { number: "desc" },
    select: { number: true },
  });
  const last = latest ? Number(latest.number.slice(prefix.length)) : 0;
  const next = Number.isFinite(last) ? last + 1 : 1;
  return `${prefix}${String(next).padStart(6, "0")}`;
}

export async function placeOrder(input: CheckoutInput): Promise<CheckoutResult> {
  const parsed = checkoutSchema.parse(input);
  if (input.lines.length === 0) {
    throw new Error("Корзина пуста.");
  }

  const cart = await resolveCartLines(input.lines);
  if (cart.lines.some((line) => !line.sellable) || cart.subtotalCents == null) {
    throw new Error(
      cart.issues[0] ??
        "Нельзя оформить заказ: проверьте цены и актуальность предложений в корзине.",
    );
  }

  const prisma = getPrismaClient();
  const method = await prisma.deliveryMethod.findFirst({
    where: { id: parsed.deliveryMethodId, isActive: true },
  });
  if (!method) {
    throw new Error("Выберите доступный способ доставки.");
  }
  if (method.requiresAddress && !parsed.address?.trim()) {
    throw new Error("Для этого способа доставки укажите адрес.");
  }

  const quote = quoteDeliveryMethod(method);
  const payStatus = paymentProviderStatus();
  let checkoutMode = parsed.checkoutMode;
  let paymentMessage =
    "Заказ передан менеджеру. Онлайн-оплата не используется для этого режима.";
  let paymentState: "NOT_CONNECTED" | "AWAITING" = "NOT_CONNECTED";

  if (checkoutMode === "ONLINE") {
    if (!payStatus.configured) {
      throw new Error(payStatus.message);
    }
    paymentMessage = payStatus.message;
    paymentState = "AWAITING";
  } else {
    checkoutMode = "MANAGER";
    paymentMessage = payStatus.configured
      ? "Режим менеджера: онлайн-оплату можно подключить позже, если провайдер настроен."
      : payStatus.message;
  }

  const attribution: AttributionSnapshot = buildAttributionSnapshot({
    firstCookie: input.attributionCookies?.first,
    lastCookie: input.attributionCookies?.last,
    body: parsed.attribution,
  });
  const attributionFields = attributionToPrisma(attribution);

  // Re-read offers inside transaction for freshness (price + updatedAt).
  const result = await prisma.$transaction(async (tx) => {
    const offerIds = cart.lines.map((line) => line.offerId);
    const fresh = await tx.productOffer.findMany({
      where: { id: { in: offerIds }, status: "ACTIVE" },
      include: {
        product: { select: { id: true, name: true, article: true, status: true } },
      },
    });
    const freshById = new Map(fresh.map((row) => [row.id, row]));

    for (const line of cart.lines) {
      const offer = freshById.get(line.offerId);
      if (!offer || offer.product.status !== "PUBLISHED") {
        throw new Error(`«${line.name}»: предложение изменилось. Обновите корзину.`);
      }
      if (offer.updatedAt.toISOString() !== line.offerUpdatedAt) {
        throw new Error(
          `«${line.name}»: предложение обновилось. Пересчитайте корзину и повторите оформление.`,
        );
      }
      const retail = offer.retailPrice
        ? Math.round(Number(offer.retailPrice.toFixed(2)) * 100)
        : null;
      if (retail == null || retail !== line.unitPriceCents) {
        throw new Error(
          `«${line.name}»: цена изменилась. Пересчитайте корзину перед оформлением.`,
        );
      }
    }

    const number = await nextOrderNumber(tx);
    const accessToken = randomBytes(24).toString("base64url");
    const subtotalCents = cart.subtotalCents!;
    const deliveryCents = quote.chargedCents;
    const totalCents = subtotalCents + deliveryCents;

    const order = await tx.order.create({
      data: {
        number,
        accessToken,
        status: "NEW",
        paymentState,
        checkoutMode,
        customerName: parsed.name,
        customerPhone: parsed.phone,
        customerEmail: parsed.email || null,
        customerCity: parsed.city || null,
        comment: parsed.comment || null,
        deliveryMethodId: method.id,
        deliveryMethod: method.name,
        deliveryAddress: parsed.address || null,
        deliveryNote: quote.message,
        deliveryEtaText: quote.etaText,
        deliveryCostConfirmedByManager: !quote.costPendingManager,
        deliveryEtaConfirmedByManager: !quote.etaPendingManager,
        paymentNote: paymentMessage,
        subtotalCents,
        discountCents: 0,
        deliveryCents,
        totalCents,
        currency: "BYN",
        ...attributionFields,
        items: {
          create: cart.lines.map((line) => ({
            productId: line.productId,
            offerId: line.offerId,
            sku: line.sku || line.productSlug,
            name: line.name,
            unitPriceCents: line.unitPriceCents!,
            quantity: line.quantity,
            currency: "BYN",
            offerUpdatedAt: new Date(line.offerUpdatedAt),
            priceCapturedAt: new Date(),
          })),
        },
        statusHistory: {
          create: {
            fromStatus: null,
            toStatus: "NEW",
            actor: "checkout",
            note: checkoutMode === "MANAGER" ? "Заказ менеджеру" : "Заказ с онлайн-оплатой",
          },
        },
      },
    });

    return order;
  });

  await notifyOrderCreated({
    number: result.number,
    accessToken: result.accessToken,
    customerName: result.customerName,
    customerPhone: result.customerPhone,
    customerEmail: result.customerEmail,
    totalCents: result.totalCents,
    checkoutMode: result.checkoutMode,
  });

  return {
    orderId: result.id,
    number: result.number,
    accessToken: result.accessToken,
    status: result.status,
    paymentState: result.paymentState,
    checkoutMode: result.checkoutMode,
    totalCents: result.totalCents,
    currency: "BYN",
    paymentMessage,
    onlinePaymentAvailable: payStatus.configured,
  };
}
