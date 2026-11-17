import "server-only";

import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import { writeAudit } from "@/modules/admin/audit";

const methodSchema = z.object({
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(60)
    .optional(),
  name: z.string().trim().min(2).max(120),
  description: z.string().trim().max(1000).optional(),
  requiresAddress: z.boolean().optional(),
  basePriceCents: z.number().int().nonnegative().nullable().optional(),
  etaDaysMin: z.number().int().min(0).max(365).nullable().optional(),
  etaDaysMax: z.number().int().min(0).max(365).nullable().optional(),
  managerConfirmsCost: z.boolean().optional(),
  managerConfirmsEta: z.boolean().optional(),
  isActive: z.boolean().optional(),
  sortOrder: z.number().int().optional(),
});

export type DeliveryQuote = {
  methodId: string;
  code: string;
  name: string;
  requiresAddress: boolean;
  /** Amount added to checkout now; null means manager will confirm later (0 charged). */
  chargedCents: number;
  costPendingManager: boolean;
  etaPendingManager: boolean;
  etaText: string | null;
  message: string;
};

export async function listActiveDeliveryMethods() {
  return getPrismaClient().deliveryMethod.findMany({
    where: { isActive: true },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export async function listAllDeliveryMethods() {
  return getPrismaClient().deliveryMethod.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
}

export function quoteDeliveryMethod(method: {
  id: string;
  code: string;
  name: string;
  requiresAddress: boolean;
  basePriceCents: number | null;
  etaDaysMin: number | null;
  etaDaysMax: number | null;
  managerConfirmsCost: boolean;
  managerConfirmsEta: boolean;
}): DeliveryQuote {
  const costPending = method.managerConfirmsCost || method.basePriceCents == null;
  const etaPending = method.managerConfirmsEta;
  let etaText: string | null = null;
  if (method.etaDaysMin != null && method.etaDaysMax != null) {
    etaText =
      method.etaDaysMin === method.etaDaysMax
        ? `${method.etaDaysMin} дн.`
        : `${method.etaDaysMin}–${method.etaDaysMax} дн.`;
  } else if (method.etaDaysMin != null) {
    etaText = `от ${method.etaDaysMin} дн.`;
  }

  return {
    methodId: method.id,
    code: method.code,
    name: method.name,
    requiresAddress: method.requiresAddress,
    chargedCents: costPending ? 0 : (method.basePriceCents ?? 0),
    costPendingManager: costPending,
    etaPendingManager: etaPending || etaText == null,
    etaText,
    message: costPending
      ? `«${method.name}»: стоимость доставки подтвердит менеджер.`
      : `«${method.name}»: в заказ добавлен справочный тариф ${(method.basePriceCents! / 100).toFixed(2)} BYN.`,
  };
}

export async function createDeliveryMethod(input: z.input<typeof methodSchema>) {
  const parsed = methodSchema.parse(input);
  const code = parsed.code || slugify(parsed.name, "delivery");
  const method = await getPrismaClient().deliveryMethod.create({
    data: {
      code,
      name: parsed.name,
      description: parsed.description || null,
      requiresAddress: parsed.requiresAddress ?? false,
      basePriceCents: parsed.basePriceCents ?? null,
      etaDaysMin: parsed.etaDaysMin ?? null,
      etaDaysMax: parsed.etaDaysMax ?? null,
      managerConfirmsCost: parsed.managerConfirmsCost ?? true,
      managerConfirmsEta: parsed.managerConfirmsEta ?? true,
      isActive: parsed.isActive ?? true,
      sortOrder: parsed.sortOrder ?? 0,
    },
  });
  await writeAudit({
    action: "delivery.create",
    entityType: "DeliveryMethod",
    entityId: method.id,
    summary: `Добавлен способ доставки «${method.name}».`,
  });
  return method;
}

export async function confirmOrderDelivery(input: {
  orderId: string;
  deliveryCents?: number;
  deliveryEtaText?: string | null;
  confirmCost?: boolean;
  confirmEta?: boolean;
  actor?: string;
}) {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) {
    throw new Error("Заказ не найден.");
  }
  const deliveryCents =
    input.deliveryCents === undefined ? order.deliveryCents : input.deliveryCents;
  if (deliveryCents < 0) {
    throw new Error("Стоимость доставки не может быть отрицательной.");
  }
  const subtotal = order.subtotalCents - order.discountCents;
  const totalCents = Math.max(0, subtotal + deliveryCents);
  const updated = await prisma.order.update({
    where: { id: order.id },
    data: {
      deliveryCents,
      totalCents,
      deliveryEtaText:
        input.deliveryEtaText === undefined ? order.deliveryEtaText : input.deliveryEtaText,
      deliveryCostConfirmedByManager:
        input.confirmCost === false
          ? order.deliveryCostConfirmedByManager
          : true,
      deliveryEtaConfirmedByManager:
        input.confirmEta === false ? order.deliveryEtaConfirmedByManager : true,
      deliveryNote: [
        order.deliveryNote,
        input.confirmCost !== false ? "Стоимость доставки подтверждена менеджером." : null,
        input.confirmEta !== false ? "Срок доставки подтверждён менеджером." : null,
      ]
        .filter(Boolean)
        .join(" "),
    },
  });
  await writeAudit({
    action: "delivery.confirm",
    entityType: "Order",
    entityId: order.id,
    summary: `Менеджер подтвердил доставку по заказу ${order.number}.`,
  });
  return updated;
}
