import type { AvailabilityStatus } from "@/modules/commerce/availability";

export type Audience = "retail" | "b2b";

export type OrganizationStatus = "pending" | "approved" | "rejected" | "suspended";

export type InternalOffer = {
  offerId: string;
  availability: AvailabilityStatus;
  quantityAvailable: number;
  reserved: number;
  leadTimeDays: number | null;
  retailPriceMinor: number | null;
  b2bPriceMinor: number | null;
  costPriceMinor: number;
  supplierName: string;
};

export type PublicOffer = {
  offerId: string;
  availability: InternalOffer["availability"];
  quantityAvailable: number;
  leadTimeDays: number | null;
  priceMinor: number | null;
  currency: "BYN";
  priceKind: Audience;
};

const publicOfferKeys = [
  "offerId",
  "availability",
  "quantityAvailable",
  "leadTimeDays",
  "priceMinor",
  "currency",
  "priceKind",
] as const satisfies readonly (keyof PublicOffer)[];

/**
 * Wholesale prices are visible only to an organization the staff has approved.
 * A missing status is retail. Pending and rejected organizations do not receive B2B prices.
 */
export function resolveAudience(input: {
  organizationStatus?: OrganizationStatus | null;
}): Audience {
  return input.organizationStatus === "approved" ? "b2b" : "retail";
}

/**
 * Drops purchase cost, margin inputs, supplier name and reserved quantity.
 * A missing B2B price stays empty. It is not replaced with the retail price.
 */
export function toPublicOffer(offer: InternalOffer, audience: Audience): PublicOffer {
  const priceMinor = audience === "b2b" ? offer.b2bPriceMinor : offer.retailPriceMinor;
  const publicOffer: PublicOffer = {
    offerId: offer.offerId,
    availability: offer.availability,
    quantityAvailable: offer.quantityAvailable,
    leadTimeDays: offer.leadTimeDays,
    priceMinor,
    currency: "BYN",
    priceKind: audience,
  };

  const keys = Object.keys(publicOffer);
  if (
    keys.length !== publicOfferKeys.length ||
    publicOfferKeys.some((key) => !(key in publicOffer))
  ) {
    throw new Error("Public offer exposed an unexpected field");
  }

  return publicOffer;
}
