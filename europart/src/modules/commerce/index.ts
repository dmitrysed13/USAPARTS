import type { AppModule } from "@/modules/types";

export const commerceModule = {
  id: "commerce",
  stage: 6,
  summary:
    "Корзина, checkout менеджера, статусы заказа, доставка и PaymentProvider. Без фейковой оплаты.",
} satisfies AppModule;

export {
  availabilityLabels,
  availabilityStatuses,
  formatLeadTime,
  type AvailabilityStatus,
} from "@/modules/commerce/availability";
export {
  resolveAudience,
  toPublicOffer,
  type Audience,
  type InternalOffer,
  type OrganizationStatus,
  type PublicOffer,
} from "@/modules/commerce/pricing";
export {
  computeRetailPrice,
  convertToByn,
  selectMarkupRule,
  toManagerPriceView,
} from "@/modules/commerce/retail-pricing";
export { toPublicStock, importStockFlags, isStockConfirmed } from "@/modules/commerce/stock";
export {
  canTransitionOrderStatus,
  orderStatusLabels,
  orderStatuses,
} from "@/modules/commerce/order-status";
export { placeOrder } from "@/modules/commerce/checkout";
export { resolvePaymentProvider, paymentProviderStatus } from "@/modules/commerce/payment/provider";
