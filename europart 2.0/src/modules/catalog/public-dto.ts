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
  type: "OEM" | "ARTICLE" | "CROSS_REFERENCE";
  isPrimary: boolean;
};

export type PublicCompatibility = {
  brandName: string;
  brandSlug: string;
  modelName: string;
  modelSlug: string;
  modificationName: string;
  yearFrom: number | null;
  yearTo: number | null;
};

export type PublicProduct = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  article: string | null;
  oem: string | null;
  condition: "NEW" | "USED";
  productType: "ORIGINAL" | "ANALOG";
  weightKg: string | null;
  category: { name: string; slug: string };
  partBrand: { name: string; slug: string; country: string | null } | null;
  images: { url: string; alt: string }[];
  identifiers: PublicIdentifier[];
  compatibility: PublicCompatibility[];
  price: { amount: string; currency: string } | null;
  availability: PublicAvailability;
  leadTimeDays: number | null;
};

export type InternalOfferView = {
  retailPrice: MoneyValue | null;
  currency: string;
  availabilityStatus: OfferAvailability;
  leadTime: number | null;
  purchasePrice?: MoneyValue | null;
  b2bPrice?: MoneyValue | null;
  supplierId?: string | null;
  supplierName?: string | null;
};

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
  availability: PublicAvailability;
  leadTimeDays: number | null;
} {
  if (offers.length === 0) {
    return { price: null, availability: "unknown", leadTimeDays: null };
  }

  const ranked = [...offers].sort((left, right) => {
    const byStatus =
      availabilityRank[left.availabilityStatus] -
      availabilityRank[right.availabilityStatus];
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

  const chosen = ranked[0];
  const amount = chosen.retailPrice ? chosen.retailPrice.toFixed(2) : null;
  return {
    price: amount ? { amount, currency: chosen.currency.trim() || "BYN" } : null,
    availability: publicAvailability[chosen.availabilityStatus],
    leadTimeDays: chosen.availabilityStatus === "UNKNOWN" ? null : chosen.leadTime,
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
  return {
    id: input.id,
    name: input.name,
    slug: input.slug,
    description: input.description,
    article: input.article,
    oem: primaryOem?.value ?? input.oem,
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
    compatibility: input.compatibility
      .filter((row) => row.confidence === "VERIFIED")
      .map((row) => ({
        brandName: row.brandName,
        brandSlug: row.brandSlug,
        modelName: row.modelName,
        modelSlug: row.modelSlug,
        modificationName: row.modificationName,
        yearFrom: row.yearFrom,
        yearTo: row.yearTo,
      })),
    price: offer.price,
    availability: offer.availability,
    leadTimeDays: offer.leadTimeDays,
  };
}
