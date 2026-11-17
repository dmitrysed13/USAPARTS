import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { listOffers, upsertOffer } from "@/modules/inventory/offers";
import { toManagerPriceView } from "@/modules/commerce/retail-pricing";

export async function GET(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "stock");
  if (!gate.ok) {
    return gate.response;
  }
  const url = new URL(request.url);
  const productId = url.searchParams.get("productId") ?? undefined;
  const offers = await listOffers(productId);
  return adminJson({
    offers: offers.map((offer) => {
      const purchase = offer.purchasePrice
        ? Number(offer.purchasePrice.toFixed(2))
        : null;
      const retail = offer.retailPrice ? Number(offer.retailPrice.toFixed(2)) : null;
      const b2b = offer.b2bPrice ? Number(offer.b2bPrice.toFixed(2)) : null;
      return {
        id: offer.id,
        product: offer.product,
        sourceType: offer.sourceType,
        supplier: offer.supplier,
        warehouse: offer.warehouse,
        externalId: offer.externalId,
        status: offer.status,
        condition: offer.condition,
        currency: offer.currency,
        quantity: offer.quantity,
        availabilityStatus: offer.availabilityStatus,
        stockSource: offer.stockSource,
        stockConfirmed: offer.stockConfirmed,
        stockUpdatedAt: offer.stockUpdatedAt,
        leadTime: offer.leadTime,
        managerPrice: toManagerPriceView({
          purchaseAmount: purchase,
          purchaseCurrency: offer.purchaseCurrency,
          retailAmount: retail,
          b2bAmount: b2b,
        }),
      };
    }),
  });
}

export async function POST(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "stock");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const offer = await upsertOffer({
      productId: String(body.productId ?? ""),
      sourceType: body.sourceType === "OWN_STOCK" ? "OWN_STOCK" : "SUPPLIER",
      supplierId: body.supplierId ? String(body.supplierId) : null,
      warehouseId: body.warehouseId ? String(body.warehouseId) : null,
      externalId: body.externalId ? String(body.externalId) : null,
      condition: body.condition === "USED" ? "USED" : "NEW",
      status:
        body.status === "INACTIVE" || body.status === "ARCHIVED"
          ? body.status
          : "ACTIVE",
      purchasePrice:
        body.purchasePrice === null || body.purchasePrice === undefined
          ? null
          : Number(body.purchasePrice),
      purchaseCurrency: body.purchaseCurrency
        ? String(body.purchaseCurrency)
        : null,
      retailPrice:
        body.retailPrice === null || body.retailPrice === undefined
          ? null
          : Number(body.retailPrice),
      b2bPrice:
        body.b2bPrice === null || body.b2bPrice === undefined
          ? null
          : Number(body.b2bPrice),
      extrasAmount:
        body.extrasAmount === null || body.extrasAmount === undefined
          ? null
          : Number(body.extrasAmount),
      currency: body.currency ? String(body.currency) : "BYN",
      quantity: body.quantity === undefined ? undefined : Number(body.quantity),
      availabilityStatus: body.availabilityStatus as
        | "IN_STOCK"
        | "LOW_STOCK"
        | "ON_ORDER"
        | "INCOMING"
        | "OUT_OF_STOCK"
        | "DISCONTINUED"
        | "UNKNOWN"
        | undefined,
      stockConfirmed:
        body.stockConfirmed === undefined ? undefined : Boolean(body.stockConfirmed),
      leadTime: body.leadTime === undefined ? undefined : Number(body.leadTime),
      computeRetail: Boolean(body.computeRetail),
    });
    return adminJson({ id: offer.id }, 201);
  } catch (error) {
    return fail(request, "/api/admin/offers", publicError(error, "Не сохранено."), 400);
  }
}
