import "server-only";

import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import { writeAudit } from "@/modules/admin/audit";
import {
  computeRetailPrice,
  toManagerPriceView,
  type MarkupRuleMatch,
} from "@/modules/commerce/retail-pricing";
import { importStockFlags } from "@/modules/commerce/stock";
import { findActiveFxRate } from "@/modules/commerce/fx-rates";
import { findMarkupRulesForOffer } from "@/modules/commerce/markup-rules";

const upsertSchema = z.object({
  productId: z.string().uuid(),
  sourceType: z.enum(["OWN_STOCK", "SUPPLIER"]),
  supplierId: z.string().uuid().nullable().optional(),
  warehouseId: z.string().uuid().nullable().optional(),
  externalId: z.string().trim().max(120).nullable().optional(),
  condition: z.enum(["NEW", "USED"]).optional(),
  status: z.enum(["ACTIVE", "INACTIVE", "ARCHIVED"]).optional(),
  purchasePrice: z.number().nonnegative().nullable().optional(),
  purchaseCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .nullable()
    .optional(),
  retailPrice: z.number().nonnegative().nullable().optional(),
  b2bPrice: z.number().nonnegative().nullable().optional(),
  extrasAmount: z.number().nonnegative().nullable().optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .optional(),
  quantity: z.number().int().nonnegative().optional(),
  availabilityStatus: z
    .enum([
      "IN_STOCK",
      "LOW_STOCK",
      "ON_ORDER",
      "INCOMING",
      "OUT_OF_STOCK",
      "DISCONTINUED",
      "UNKNOWN",
    ])
    .optional(),
  stockConfirmed: z.boolean().optional(),
  leadTime: z.number().int().min(0).max(365).nullable().optional(),
  /** When true and retail omitted, attempt purchase→FX→markup→retail. */
  computeRetail: z.boolean().optional(),
});

export type OfferUpsertInput = z.input<typeof upsertSchema>;

export async function listOffers(productId?: string) {
  return getPrismaClient().productOffer.findMany({
    where: productId ? { productId } : undefined,
    orderBy: { updatedAt: "desc" },
    include: {
      supplier: { select: { id: true, name: true, code: true } },
      warehouse: { select: { id: true, name: true, code: true, type: true } },
      product: { select: { id: true, name: true, slug: true } },
    },
    take: 200,
  });
}

export async function getManagerOffer(id: string) {
  const offer = await getPrismaClient().productOffer.findUnique({
    where: { id },
    include: {
      supplier: { select: { id: true, name: true, code: true } },
      warehouse: { select: { id: true, name: true, code: true, type: true } },
      product: {
        select: {
          id: true,
          name: true,
          slug: true,
          categoryId: true,
          partBrandId: true,
        },
      },
      priceHistory: { orderBy: { createdAt: "desc" }, take: 20 },
    },
  });
  if (!offer) {
    return null;
  }
  const purchase = offer.purchasePrice ? Number(offer.purchasePrice.toFixed(2)) : null;
  const retail = offer.retailPrice ? Number(offer.retailPrice.toFixed(2)) : null;
  const b2b = offer.b2bPrice ? Number(offer.b2bPrice.toFixed(2)) : null;
  return {
    ...offer,
    managerPrice: toManagerPriceView({
      purchaseAmount: purchase,
      purchaseCurrency: offer.purchaseCurrency,
      retailAmount: retail,
      b2bAmount: b2b,
    }),
  };
}

export async function upsertOffer(input: OfferUpsertInput) {
  const parsed = upsertSchema.parse(input);
  if (parsed.sourceType === "SUPPLIER" && !parsed.supplierId) {
    throw new Error("Для предложения поставщика укажите поставщика.");
  }
  if (parsed.sourceType === "OWN_STOCK" && parsed.supplierId) {
    throw new Error("Своему складу не назначается поставщик.");
  }

  const prisma = getPrismaClient();
  const product = await prisma.product.findUnique({
    where: { id: parsed.productId },
    select: { id: true, categoryId: true, partBrandId: true },
  });
  if (!product) {
    throw new Error("Товар не найден.");
  }

  const availability = parsed.availabilityStatus ?? "UNKNOWN";
  const flags = importStockFlags({
    sourceType: parsed.sourceType,
    availability,
  });
  const stockConfirmed = parsed.stockConfirmed ?? flags.stockConfirmed;

  let retailPrice = parsed.retailPrice ?? null;
  let b2bPrice = parsed.b2bPrice ?? null;
  let pricingMeta: {
    fxRate: number | null;
    markupType: "PERCENT" | "FIXED" | null;
    markupValue: number | null;
  } = { fxRate: null, markupType: null, markupValue: null };

  if (
    parsed.computeRetail &&
    retailPrice === null &&
    parsed.purchasePrice !== null &&
    parsed.purchasePrice !== undefined &&
    parsed.purchaseCurrency
  ) {
    const fx = await findActiveFxRate(parsed.purchaseCurrency, "BYN");
    const rules = await findMarkupRulesForOffer({
      categoryId: product.categoryId,
      supplierId: parsed.supplierId ?? null,
      partBrandId: product.partBrandId,
    });
    const priced = computeRetailPrice({
      purchaseAmount: parsed.purchasePrice,
      purchaseCurrency: parsed.purchaseCurrency,
      extrasAmount: parsed.extrasAmount,
      fx: fx
        ? { rate: fx.rate, source: fx.source, effectiveFrom: fx.effectiveFrom }
        : null,
      rule: rules[0] as MarkupRuleMatch | null,
    });
    retailPrice = priced.retailAmount;
    b2bPrice = priced.b2bAmount;
    pricingMeta = {
      fxRate: priced.fxRate,
      markupType: priced.markupType,
      markupValue: priced.markupValue,
    };
    if (priced.reason && retailPrice === null) {
      throw new Error(priced.reason);
    }
  }

  const existing = await prisma.productOffer.findFirst({
    where: {
      productId: parsed.productId,
      sourceType: parsed.sourceType,
      supplierId: parsed.supplierId ?? null,
      warehouseId: parsed.warehouseId ?? null,
      externalId: parsed.externalId ?? null,
    },
  });

  const now = new Date();
  const data = {
    condition: parsed.condition ?? "NEW",
    status: parsed.status ?? "ACTIVE",
    purchasePrice:
      parsed.purchasePrice === undefined ? undefined : parsed.purchasePrice,
    purchaseCurrency:
      parsed.purchaseCurrency === undefined ? undefined : parsed.purchaseCurrency,
    retailPrice: retailPrice === null && parsed.retailPrice === undefined ? undefined : retailPrice,
    b2bPrice: b2bPrice === null && parsed.b2bPrice === undefined ? undefined : b2bPrice,
    extrasAmount: parsed.extrasAmount === undefined ? undefined : parsed.extrasAmount,
    currency: parsed.currency ?? "BYN",
    quantity: parsed.quantity,
    availabilityStatus: availability,
    stockSource: flags.stockSource,
    stockConfirmed,
    stockUpdatedAt: now,
    leadTime: parsed.leadTime === undefined ? undefined : parsed.leadTime,
    externalId: parsed.externalId === undefined ? undefined : parsed.externalId,
  };

  const offer = existing
    ? await prisma.productOffer.update({
        where: { id: existing.id },
        data,
      })
    : await prisma.productOffer.create({
        data: {
          productId: parsed.productId,
          sourceType: parsed.sourceType,
          supplierId: parsed.supplierId ?? null,
          warehouseId: parsed.warehouseId ?? null,
          externalId: parsed.externalId ?? null,
          condition: parsed.condition ?? "NEW",
          status: parsed.status ?? "ACTIVE",
          purchasePrice: parsed.purchasePrice ?? null,
          purchaseCurrency: parsed.purchaseCurrency ?? null,
          retailPrice,
          b2bPrice,
          extrasAmount: parsed.extrasAmount ?? null,
          currency: parsed.currency ?? "BYN",
          quantity: parsed.quantity ?? 0,
          availabilityStatus: availability,
          stockSource: flags.stockSource,
          stockConfirmed,
          stockUpdatedAt: now,
          leadTime: parsed.leadTime ?? null,
        },
      });

  if (
    parsed.purchasePrice !== undefined ||
    retailPrice !== null ||
    b2bPrice !== null
  ) {
    await prisma.offerPriceHistory.create({
      data: {
        offerId: offer.id,
        purchasePrice: offer.purchasePrice,
        purchaseCurrency: offer.purchaseCurrency,
        fxRate: pricingMeta.fxRate,
        markupType: pricingMeta.markupType,
        markupValue: pricingMeta.markupValue,
        extrasAmount: offer.extrasAmount,
        retailPrice: offer.retailPrice,
        b2bPrice: offer.b2bPrice,
        currency: offer.currency,
        source: existing ? "offer.update" : "offer.create",
      },
    });
  }

  await writeAudit({
    action: existing ? "offer.update" : "offer.create",
    entityType: "ProductOffer",
    entityId: offer.id,
    summary: existing
      ? `Обновлено предложение товара ${parsed.productId}.`
      : `Создано предложение товара ${parsed.productId}.`,
  });

  return offer;
}
