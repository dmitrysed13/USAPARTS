import { connection } from "next/server";
import { createCategory } from "@/modules/admin/catalog-writes";
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
    const category = await createCategory({
      name: formText(form, "name"),
      parentId: formText(form, "parentId") || null,
    });
    if (wantsHtml(request)) {
      return new Response(null, {
        status: 303,
        headers: { location: "/admin/categories" },
      });
    }
    return Response.json(
      { id: category.id },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Категория не сохранена.";
    return fail(request, "/admin/categories", message, 400);
  }
}
