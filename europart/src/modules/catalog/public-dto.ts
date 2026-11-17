import type { OfferAvailability } from "@/generated/prisma/client";

export type MoneyValue = { toFixed: (digits: number) => string };

export type PublicAvailability =
  | "in_stock"
  | "low_stock"
  | "on_order"
  | "incoming"
  | "out_of_stock"
  | "discontinued"
  | "unknown";

export type PublicIdentifier = {
  value: string;
  type: "OEM" | "ARTICLE" | "CROSS_REFERENCE" | "ANALOG";
  isPrimary: boolean;
};

export type PublicCompatibility = {
  brandName: string;
  brandSlug: string;
  modelName: string;
  modelSlug: string;
  generationName?: string;
  generationSlug?: string;
  modificationName: string;
  modificationSlug?: string;
  engineName?: string;
  engineSlug?: string;
  yearFrom: number | null;
  yearTo: number | null;
};

/** Public offer origin — never includes supplier name or purchase terms. */
export type PublicOfferSource = "own_stock" | "supplier";

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  article: string | null;
  oem: string | null;
  mpn: string | null;
  condition: "NEW" | "USED";
  productType: "ORIGINAL" | "ANALOG";
  weightKg: string | null;
  category: { name: string; slug: string };
  partBrand: { name: string; slug: string; country: string | null } | null;
  images: { url: string; alt: string }[];
  identifiers: PublicIdentifier[];
  /** Analog / cross numbers from identifiers when present. */
  analogs: string[];
  compatibility: PublicCompatibility[];
  price: { amount: string; currency: string } | null;
  /** Selected sellable offer for cart; null when no public price/offer. */
  offerId: string | null;
  availability: PublicAvailability;
  leadTimeDays: number | null;
  /** OWN_STOCK vs SUPPLIER label only — no supplier identity. */
  offerSource: PublicOfferSource | null;
};

export type InternalOfferView = {
  offerId?: string;
  retailPrice: MoneyValue | null;
  currency: string;
  availabilityStatus: OfferAvailability;
  leadTime: number | null;
  /** When false / missing, storefront treats availability as unconfirmed. */
  stockConfirmed?: boolean;
  status?: "ACTIVE" | "INACTIVE" | "ARCHIVED";
  sourceType?: "OWN_STOCK" | "SUPPLIER";
  purchasePrice?: MoneyValue | null;
  b2bPrice?: MoneyValue | null;
  supplierId?: string | null;
  supplierName?: string | null;
};

function effectiveAvailability(offer: InternalOfferView): OfferAvailability {
  if (offer.status && offer.status !== "ACTIVE") {
    return "UNKNOWN";
  }
  // Explicit false = unconfirmed; never claim warehouse/supplier stock on the storefront.
  if (offer.stockConfirmed === false) {
    return "UNKNOWN";
  }
  return offer.availabilityStatus;
}

const availabilityRank: Record<OfferAvailability, number> = {
  IN_STOCK: 0,
  LOW_STOCK: 1,
  INCOMING: 2,
  ON_ORDER: 3,
  UNKNOWN: 4,
  OUT_OF_STOCK: 5,
  DISCONTINUED: 6,
};

const publicAvailability: Record<OfferAvailability, PublicAvailability> = {
  IN_STOCK: "in_stock",
  LOW_STOCK: "low_stock",
  INCOMING: "incoming",
  ON_ORDER: "on_order",
  UNKNOWN: "unknown",
  OUT_OF_STOCK: "out_of_stock",
  DISCONTINUED: "discontinued",
};

export const publicAvailabilityLabels: Record<PublicAvailability, string> = {
  in_stock: "В наличии",
  low_stock: "Мало на складе",
  on_order: "Под заказ",
  incoming: "Ожидается поставка",
  out_of_stock: "Нет в наличии",
  discontinued: "Снят с продажи",
  unknown: "Наличие не подтверждено",
};

function minorUnits(value: MoneyValue | null): number | null {
  if (!value) {
    return null;
  }
  return Math.round(Number(value.toFixed(2)) * 100);
}

export function selectPublicOffer(offers: InternalOfferView[]): {
  price: PublicProduct["price"];
  offerId: string | null;
  availability: PublicAvailability;
  leadTimeDays: number | null;
  offerSource: PublicOfferSource | null;
} {
  const active = offers.filter((offer) => !offer.status || offer.status === "ACTIVE");
  if (active.length === 0) {
    return {
      price: null,
      offerId: null,
      availability: "unknown",
      leadTimeDays: null,
      offerSource: null,
    };
  }

  const ranked = [...active].sort((left, right) => {
    const byStatus =
      availabilityRank[effectiveAvailability(left)] -
      availabilityRank[effectiveAvailability(right)];
    if (byStatus !== 0) {
      return byStatus;
    }
    const leftPrice = minorUnits(left.retailPrice);
    const rightPrice = minorUnits(right.retailPrice);
    if (leftPrice === null) {
      return 1;
    }
    if (rightPrice === null) {
      return -1;
    }
    return leftPrice - rightPrice;
  });

  const chosen = ranked[0]!;
  const status = effectiveAvailability(chosen);
  const amount = chosen.retailPrice ? chosen.retailPrice.toFixed(2) : null;
  return {
    price: amount ? { amount, currency: chosen.currency.trim() || "BYN" } : null,
    offerId: chosen.offerId ?? null,
    availability: publicAvailability[status],
    leadTimeDays: status === "UNKNOWN" ? null : chosen.leadTime,
    offerSource:
      chosen.sourceType === "OWN_STOCK"
        ? "own_stock"
        : chosen.sourceType === "SUPPLIER"
          ? "supplier"
          : null,
  };
}

type CompatibilityInput = PublicCompatibility & {
  confidence: "UNVERIFIED" | "PROBABLE" | "VERIFIED";
};

export function toPublicProduct(input: {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  article: string | null;
  oem: string | null;
  mpn?: string | null;
  condition: "NEW" | "USED";
  productType: "ORIGINAL" | "ANALOG";
  weight: MoneyValue | null;
  category: { name: string; slug: string };
  partBrand: { name: string; slug: string; country: string | null } | null;
  images: { url: string; alt: string | null; sortOrder: number }[];
  identifiers: PublicIdentifier[];
  compatibility: CompatibilityInput[];
  offers: InternalOfferView[];
}): PublicProduct {
  const primaryOem = input.identifiers.find(
    (identifier) => identifier.type === "OEM" && identifier.isPrimary,
  );
  const offer = selectPublicOffer(input.offers);
  const analogs = input.identifiers
    .filter((identifier) => identifier.type === "ANALOG" || identifier.type === "CROSS_REFERENCE")
    .map((identifier) => identifier.value);
  return {
    id: input.id,
    name: input.name,
    slug: input.slug,
    description: input.description,
    article: input.article,
    oem: primaryOem?.value ?? input.oem,
    mpn: input.mpn?.trim() || null,
    condition: input.condition,
    productType: input.productType,
    weightKg: input.weight ? input.weight.toFixed(3) : null,
    category: input.category,
    partBrand: input.partBrand,
    images: [...input.images]
      .sort((left, right) => left.sortOrder - right.sortOrder)
      .map((image) => ({ url: image.url, alt: image.alt?.trim() || input.name })),
    identifiers: input.identifiers.map((identifier) => ({
      value: identifier.value,
      type: identifier.type,
      isPrimary: identifier.isPrimary,
    })),
    analogs,
    compatibility: input.compatibility
      .filter((row) => row.confidence === "VERIFIED")
      .map((row) => ({
        brandName: row.brandName,
        brandSlug: row.brandSlug,
        modelName: row.modelName,
        modelSlug: row.modelSlug,
        generationName: row.generationName,
        generationSlug: row.generationSlug,
        modificationName: row.modificationName,
        modificationSlug: row.modificationSlug,
        engineName: row.engineName,
        engineSlug: row.engineSlug,
        yearFrom: row.yearFrom,
        yearTo: row.yearTo,
      })),
    price: offer.price,
    offerId: offer.offerId,
    availability: offer.availability,
    leadTimeDays: offer.leadTimeDays,
    offerSource: offer.offerSource,
  };
}
