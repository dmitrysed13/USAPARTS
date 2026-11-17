import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import { writeAudit } from "@/modules/admin/audit";
import {
  assertOrderStatusTransition,
  orderStatusLabels,
  type OrderStatusId,
} from "@/modules/commerce/order-status";
import { notifyOrderStatusChanged } from "@/modules/notifications/order-notify";

export async function getOrderByAccessToken(accessToken: string) {
  return getPrismaClient().order.findUnique({
    where: { accessToken },
    include: {
      items: true,
      deliveryMethodRef: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      paymentTransactions: { orderBy: { createdAt: "desc" }, take: 5 },
    },
  });
}

export async function listOrders(limit = 50) {
  return getPrismaClient().order.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
    include: {
      _count: { select: { items: true } },
      deliveryMethodRef: { select: { name: true, code: true } },
    },
  });
}

export async function getOrderById(id: string) {
  return getPrismaClient().order.findUnique({
    where: { id },
    include: {
      items: true,
      deliveryMethodRef: true,
      statusHistory: { orderBy: { createdAt: "asc" } },
      paymentTransactions: { orderBy: { createdAt: "desc" } },
    },
  });
}

export async function transitionOrderStatus(input: {
  orderId: string;
  toStatus: OrderStatusId;
  actor?: string;
  note?: string;
}) {
  const prisma = getPrismaClient();
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) {
    throw new Error("Заказ не найден.");
  }
  const from = order.status as OrderStatusId;
  const to = input.toStatus;
  assertOrderStatusTransition(from, to);

  const paymentState =
    to === "AWAITING_PAYMENT"
      ? ("AWAITING" as const)
      : to === "PAID"
        ? ("PAID" as const)
        : undefined;

  const updated = await prisma.$transaction(async (tx) => {
    const row = await tx.order.update({
      where: { id: order.id },
      data: {
        status: to,
        ...(paymentState ? { paymentState } : {}),
      },
    });
    await tx.orderStatusHistory.create({
      data: {
        orderId: order.id,
        fromStatus: from,
        toStatus: to,
        actor: input.actor ?? "admin",
        note: input.note ?? null,
      },
    });
    return row;
  });

  await writeAudit({
    action: "order.status",
    entityType: "Order",
    entityId: order.id,
    summary: `Заказ ${order.number}: ${orderStatusLabels[from]} → ${orderStatusLabels[to]}.`,
  });

  await notifyOrderStatusChanged({
    number: order.number,
    accessToken: order.accessToken,
    customerName: order.customerName,
    customerEmail: order.customerEmail,
    customerPhone: order.customerPhone,
    fromStatus: from,
    toStatus: to,
  });

  return updated;
}
