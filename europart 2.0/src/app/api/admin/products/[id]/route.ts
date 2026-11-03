import { connection } from "next/server";
import { archiveProduct, updateProduct } from "@/modules/admin/catalog-writes";
import { requireAdminApi } from "@/modules/admin/guard";
import { fail, formText, wantsHtml } from "@/modules/admin/respond";

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await context.params;
  const back = `/admin/products/${id}`;
  try {
    const form = await request.formData();
    if (formText(form, "intent") === "archive") {
      await archiveProduct(id);
    } else {
      const condition = formText(form, "condition") === "USED" ? "USED" : "NEW";
      const productType =
        formText(form, "productType") === "ORIGINAL" ? "ORIGINAL" : "ANALOG";
      const statusText = formText(form, "status");
      const status =
        statusText === "PUBLISHED" || statusText === "ARCHIVED" ? statusText : "DRAFT";
      await updateProduct(id, {
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
    }
    if (wantsHtml(request)) {
      return new Response(null, { status: 303, headers: { location: back } });
    }
    return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Товар не сохранён.";
    return fail(request, back, message, 400);
  }
}
