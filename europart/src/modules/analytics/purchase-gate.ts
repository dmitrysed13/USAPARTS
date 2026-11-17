/**
 * `purchase` must fire only after payment is verified (provider webhook / manager paid),
 * never on bare order creation. Use `purchase_order_created` for order placement.
 */

export type PaymentGateOrder = {
  paymentState: string;
  status: string;
  number: string;
  totalCents: number;
  currency: string;
};

export function isVerifiedPaidOrder(order: PaymentGateOrder): boolean {
  return order.paymentState === "PAID" || order.status === "PAID";
}

export function purchaseEventParams(order: PaymentGateOrder) {
  return {
    transaction_id: order.number.slice(0, 64),
    value: Number((order.totalCents / 100).toFixed(2)),
    currency: (order.currency || "BYN").trim().slice(0, 3) || "BYN",
  };
}

export function purchaseOrderCreatedParams(order: {
  number: string;
  totalCents: number;
  currency: string;
  checkoutMode?: string;
}) {
  return {
    transaction_id: order.number.slice(0, 64),
    value: Number((order.totalCents / 100).toFixed(2)),
    currency: (order.currency || "BYN").trim().slice(0, 3) || "BYN",
    checkout_mode: order.checkoutMode === "ONLINE" ? "ONLINE" : "MANAGER",
  };
}

/** localStorage key so the browser fires `purchase` once per order number. */
export function purchaseDedupeKey(orderNumber: string): string {
  return `ep_purchase_fired:${orderNumber.slice(0, 64)}`;
}
