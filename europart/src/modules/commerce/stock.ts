import type { OfferAvailability, OfferSourceType, StockSourceKind } from "@/generated/prisma/client";

/**
 * Stock semantics for §5:
 * - Storefront never treats unconfirmed stock as in-stock.
 * - Distinguish warehouse vs supplier vs on-order.
 * - Persist source + last update time on the offer.
 */

export type StockChannel = "warehouse" | "supplier" | "on_order" | "unknown";

export type OfferStockInput = {
  sourceType: OfferSourceType;
  availabilityStatus: OfferAvailability;
  stockSource: StockSourceKind | null;
  stockConfirmed: boolean;
  quantity: number;
  reservedQuantity: number;
  stockUpdatedAt: Date | null;
  leadTime: number | null;
};

export type PublicStockView = {
  channel: StockChannel;
  availability:
    | "in_stock"
    | "low_stock"
    | "on_order"
    | "incoming"
    | "out_of_stock"
    | "discontinued"
    | "unknown";
  /** Available units only when confirmed; otherwise null (not zero). */
  quantityAvailable: number | null;
  leadTimeDays: number | null;
  stockUpdatedAt: string | null;
};

const availabilityMap: Record<OfferAvailability, PublicStockView["availability"]> = {
  IN_STOCK: "in_stock",
  LOW_STOCK: "low_stock",
  ON_ORDER: "on_order",
  INCOMING: "incoming",
  OUT_OF_STOCK: "out_of_stock",
  DISCONTINUED: "discontinued",
  UNKNOWN: "unknown",
};

export function resolveStockSource(
  sourceType: OfferSourceType,
  availability: OfferAvailability,
  explicit: StockSourceKind | null = null,
): StockSourceKind {
  if (explicit) {
    return explicit;
  }
  if (availability === "ON_ORDER" || availability === "INCOMING") {
    return "ON_ORDER";
  }
  if (sourceType === "OWN_STOCK") {
    return "WAREHOUSE";
  }
  return "SUPPLIER";
}

export function isStockConfirmed(input: {
  availabilityStatus: OfferAvailability;
  stockConfirmed: boolean;
}): boolean {
  if (input.availabilityStatus === "UNKNOWN") {
    return false;
  }
  return input.stockConfirmed;
}

export function channelOf(source: StockSourceKind | null): StockChannel {
  if (source === "WAREHOUSE") {
    return "warehouse";
  }
  if (source === "SUPPLIER") {
    return "supplier";
  }
  if (source === "ON_ORDER") {
    return "on_order";
  }
  return "unknown";
}

/**
 * Public storefront stock. Unconfirmed offers never claim quantity or in-stock.
 */
export function toPublicStock(offer: OfferStockInput): PublicStockView {
  const confirmed = isStockConfirmed(offer);
  const source = resolveStockSource(offer.sourceType, offer.availabilityStatus, offer.stockSource);
  const available = Math.max(0, offer.quantity - offer.reservedQuantity);

  if (!confirmed) {
    return {
      channel: channelOf(source),
      availability: "unknown",
      quantityAvailable: null,
      leadTimeDays: null,
      stockUpdatedAt: offer.stockUpdatedAt ? offer.stockUpdatedAt.toISOString() : null,
    };
  }

  return {
    channel: channelOf(source),
    availability: availabilityMap[offer.availabilityStatus],
    quantityAvailable:
      offer.availabilityStatus === "IN_STOCK" || offer.availabilityStatus === "LOW_STOCK"
        ? available
        : null,
    leadTimeDays: offer.leadTime,
    stockUpdatedAt: offer.stockUpdatedAt ? offer.stockUpdatedAt.toISOString() : null,
  };
}

/** Import helper: confirm stock only when availability was resolved and is not UNKNOWN. */
export function importStockFlags(input: {
  sourceType: OfferSourceType;
  availability: OfferAvailability | null;
}): {
  stockSource: StockSourceKind;
  stockConfirmed: boolean;
  availabilityStatus: OfferAvailability;
} {
  const availability = input.availability ?? "UNKNOWN";
  return {
    stockSource: resolveStockSource(input.sourceType, availability, null),
    stockConfirmed: availability !== "UNKNOWN",
    availabilityStatus: availability,
  };
}
