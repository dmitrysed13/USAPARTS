import { connection } from "next/server";
import { createOffer } from "@/modules/admin/catalog-writes";
import { requireAdminApi } from "@/modules/admin/guard";
import { fail, formText, wantsHtml } from "@/modules/admin/respond";

export async function POST(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  const form = await request.formData();
  const productId = formText(form, "productId");
  const back = `/admin/products/${productId}`;
  try {
    const sourceType =
      formText(form, "sourceType") === "OWN_STOCK" ? "OWN_STOCK" : "SUPPLIER";
    const availability = formText(form, "availabilityStatus");
    const allowed = [
      "IN_STOCK",
      "LOW_STOCK",
      "ON_ORDER",
      "INCOMING",
      "OUT_OF_STOCK",
      "DISCONTINUED",
      "UNKNOWN",
    ] as const;
    const availabilityStatus = allowed.find((item) => item === availability) ?? "UNKNOWN";
    const lead = formText(form, "leadTime");
    await createOffer({
      productId,
      sourceType,
      supplierId: formText(form, "supplierId") || null,
      warehouseId: formText(form, "warehouseId") || null,
      purchasePrice: formText(form, "purchasePrice"),
      retailPrice: formText(form, "retailPrice"),
      b2bPrice: formText(form, "b2bPrice"),
      currency: formText(form, "currency") || "BYN",
      quantity: Number(formText(form, "quantity") || "0"),
      availabilityStatus,
      leadTime: lead ? Number(lead) : null,
    });
    if (wantsHtml(request)) {
      return new Response(null, { status: 303, headers: { location: back } });
    }
    return Response.json(
      { ok: true },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Предложение не сохранено.";
    return fail(request, back, message, 400);
  }
}
