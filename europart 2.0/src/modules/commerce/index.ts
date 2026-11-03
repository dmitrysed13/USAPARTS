import type { AppModule } from "@/modules/types";

export const commerceModule = {
  id: "commerce",
  stage: 4,
  summary: "Цены для витрины, корзина и заказы. Закупка и маржа клиенту не показываются.",
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
