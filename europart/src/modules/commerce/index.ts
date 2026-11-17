import type { AppModule } from "@/modules/types";

export const commerceModule = {
  id: "commerce",
  stage: 5,
  summary:
    "Розница BYN: закупка → курс → наценка → допы. Закупка и маржа клиенту не показываются. Корзина — этап §6.",
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
