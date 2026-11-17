import type { OrderStatus } from "@/generated/prisma/client";

/** Server-controlled order statuses from final-spec §6. */
export const orderStatuses = [
  "NEW",
  "UNDER_REVIEW",
  "AWAITING_CONFIRMATION",
  "CONFIRMED",
  "AWAITING_PAYMENT",
  "PAID",
  "PROCESSING",
  "ORDERED_FROM_SUPPLIER",
  "SHIPPED",
  "DELIVERED",
  "COMPLETED",
  "CANCELLED",
  "RETURN",
] as const satisfies readonly OrderStatus[];

export type OrderStatusId = (typeof orderStatuses)[number];

export const orderStatusLabels: Record<OrderStatusId, string> = {
  NEW: "Новый",
  UNDER_REVIEW: "На проверке",
  AWAITING_CONFIRMATION: "Ожидает подтверждения",
  CONFIRMED: "Подтверждён",
  AWAITING_PAYMENT: "Ожидает оплаты",
  PAID: "Оплачен",
  PROCESSING: "В обработке",
  ORDERED_FROM_SUPPLIER: "Заказан у поставщика",
  SHIPPED: "Отправлен",
  DELIVERED: "Доставлен",
  COMPLETED: "Завершён",
  CANCELLED: "Отменён",
  RETURN: "Возврат",
};

const allowedTransitions: Record<OrderStatusId, readonly OrderStatusId[]> = {
  NEW: ["UNDER_REVIEW", "AWAITING_CONFIRMATION", "CANCELLED"],
  UNDER_REVIEW: ["AWAITING_CONFIRMATION", "CONFIRMED", "CANCELLED"],
  AWAITING_CONFIRMATION: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["AWAITING_PAYMENT", "PROCESSING", "CANCELLED"],
  AWAITING_PAYMENT: ["PAID", "CANCELLED"],
  PAID: ["PROCESSING", "CANCELLED", "RETURN"],
  PROCESSING: ["ORDERED_FROM_SUPPLIER", "SHIPPED", "CANCELLED"],
  ORDERED_FROM_SUPPLIER: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED", "RETURN"],
  DELIVERED: ["COMPLETED", "RETURN"],
  COMPLETED: ["RETURN"],
  CANCELLED: [],
  RETURN: [],
};

export function canTransitionOrderStatus(
  from: OrderStatusId,
  to: OrderStatusId,
): boolean {
  if (from === to) {
    return false;
  }
  return allowedTransitions[from].includes(to);
}

export function assertOrderStatusTransition(from: OrderStatusId, to: OrderStatusId): void {
  if (!canTransitionOrderStatus(from, to)) {
    throw new Error(
      `Статус заказа нельзя сменить с «${orderStatusLabels[from]}» на «${orderStatusLabels[to]}».`,
    );
  }
}
