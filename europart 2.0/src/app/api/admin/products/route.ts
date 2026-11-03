import { connection } from "next/server";
import { createProduct } from "@/modules/admin/catalog-writes";
import { requireAdminApi } from "@/modules/admin/guard";
import { fail, formText, wantsHtml } from "@/modules/admin/respond";

export async function POST(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const form = await request.formData();
    const condition = formText(form, "condition") === "USED" ? "USED" : "NEW";
    const productType =
      formText(form, "productType") === "ORIGINAL" ? "ORIGINAL" : "ANALOG";
    const statusText = formText(form, "status");
    const status =
      statusText === "PUBLISHED" || statusText === "ARCHIVED" ? statusText : "DRAFT";
    const product = await createProduct({
      name: formText(form, "name"),
      description: formText(form, "description"),
      categoryId: formText(form, "categoryId"),
      partBrandId: formText(form, "partBrandId") || null,
      article: formText(form, "article"),
      oem: formText(form, "oem"),
      condition,
      productType,
      status,
    });
    if (wantsHtml(request)) {
      return new Response(null, {
        status: 303,
        headers: { location: `/admin/products/${product.id}` },
      });
    }
    return Response.json(
      { id: product.id },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Товар не сохранён.";
    return fail(request, "/admin/products/new", message, 400);
  }
}
