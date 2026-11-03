import { connection } from "next/server";
import { createPartBrand } from "@/modules/admin/catalog-writes";
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
    const brand = await createPartBrand(formText(form, "name"));
    if (wantsHtml(request)) {
      return new Response(null, { status: 303, headers: { location: "/admin/brands" } });
    }
    return Response.json(
      { id: brand.id },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Бренд не сохранён.";
    return fail(request, "/admin/brands", message, 400);
  }
}
