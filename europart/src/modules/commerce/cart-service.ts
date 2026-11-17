import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import type { CartLine } from "@/modules/commerce/cart-cookie";
import { isStockConfirmed } from "@/modules/commerce/stock";

export type ResolvedCartLine = {
  offerId: string;
  productId: string;
  productSlug: string;
  name: string;
  sku: string;
  quantity: number;
  unitPriceCents: number | null;
  currency: "BYN";
  offerUpdatedAt: string;
  availability: string;
  stockConfirmed: boolean;
  sellable: boolean;
  issue: string | null;
};

export type ResolvedCart = {
  lines: ResolvedCartLine[];
  subtotalCents: number | null;
  currency: "BYN";
  issues: string[];
};

function moneyToCents(value: { toFixed(digits: number): string } | null): number | null {
  if (!value) {
    return null;
  }
  return Math.round(Number(value.toFixed(2)) * 100);
}

export async function resolveCartLines(lines: CartLine[]): Promise<ResolvedCart> {
  if (lines.length === 0) {
    return { lines: [], subtotalCents: 0, currency: "BYN", issues: [] };
  }
  const prisma = getPrismaClient();
  const offers = await prisma.productOffer.findMany({
    where: { id: { in: lines.map((line) => line.offerId) } },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          article: true,
          status: true,
          category: { select: { isActive: true } },
        },
      },
    },
  });
  const byId = new Map(offers.map((offer) => [offer.id, offer]));
  const resolved: ResolvedCartLine[] = [];
  const issues: string[] = [];
  let subtotal = 0;
  let allPriced = true;

  for (const line of lines) {
    const offer = byId.get(line.offerId);
    if (!offer) {
      issues.push(`Предложение ${line.offerId} больше недоступно.`);
      resolved.push({
        offerId: line.offerId,
        productId: "",
        productSlug: "",
        name: "Недоступное предложение",
        sku: "",
        quantity: line.quantity,
        unitPriceCents: null,
        currency: "BYN",
        offerUpdatedAt: new Date(0).toISOString(),
        availability: "unknown",
        stockConfirmed: false,
        sellable: false,
        issue: "Предложение не найдено.",
      });
      allPriced = false;
      continue;
    }

    const published =
      offer.product.status === "PUBLISHED" && offer.product.category.isActive;
    const active = offer.status === "ACTIVE";
    const confirmed = isStockConfirmed({
      availabilityStatus: offer.availabilityStatus,
      stockConfirmed: offer.stockConfirmed,
    });
    const unitPriceCents = moneyToCents(offer.retailPrice);
    const availableQty = Math.max(0, offer.quantity - offer.reservedQuantity);
    let issue: string | null = null;
    if (!published) {
      issue = "Товар снят с публикации.";
    } else if (!active) {
      issue = "Предложение неактивно.";
    } else if (unitPriceCents == null) {
      issue = "Нет розничной цены — оформите заявку менеджеру.";
    } else if (
      confirmed &&
      (offer.availabilityStatus === "IN_STOCK" ||
        offer.availabilityStatus === "LOW_STOCK") &&
      availableQty < line.quantity
    ) {
      issue = `Недостаточно подтверждённого остатка (доступно ${availableQty}).`;
    } else if (offer.availabilityStatus === "DISCONTINUED") {
      issue = "Позиция снята с продажи.";
    } else if (offer.availabilityStatus === "OUT_OF_STOCK" && confirmed) {
      issue = "Нет в наличии.";
    }

    const sellable = issue == null && unitPriceCents != null;
    if (!sellable) {
      allPriced = false;
      if (issue) {
        issues.push(`${offer.product.name}: ${issue}`);
      }
    } else if (unitPriceCents != null) {
      subtotal += unitPriceCents * line.quantity;
    } else {
      allPriced = false;
    }

    resolved.push({
      offerId: offer.id,
      productId: offer.product.id,
      productSlug: offer.product.slug,
      name: offer.product.name,
      sku: offer.product.article ?? offer.externalId ?? offer.product.slug,
      quantity: line.quantity,
      unitPriceCents,
      currency: "BYN",
      offerUpdatedAt: offer.updatedAt.toISOString(),
      availability: offer.availabilityStatus,
      stockConfirmed: confirmed,
      sellable,
      issue,
    });
  }

  return {
    lines: resolved,
    subtotalCents: allPriced ? subtotal : null,
    currency: "BYN",
    issues,
  };
}
