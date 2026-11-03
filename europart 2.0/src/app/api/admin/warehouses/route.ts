import { connection } from "next/server";
import { requireAdminApi } from "@/modules/admin/guard";
import { fail, formText, wantsHtml } from "@/modules/admin/respond";
import { createWarehouse, deactivateWarehouse } from "@/modules/admin/warehouses";

export async function POST(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const form = await request.formData();
    if (formText(form, "intent") === "deactivate") {
      await deactivateWarehouse(formText(form, "id"));
    } else {
      const type = formText(form, "type");
      await createWarehouse({
        name: formText(form, "name"),
        code: formText(form, "code"),
        type: type === "SUPPLIER" ? "SUPPLIER" : "OWN",
        supplierId: formText(form, "supplierId") || null,
        city: formText(form, "city"),
      });
    }
    if (wantsHtml(request)) {
      return new Response(null, {
        status: 303,
        headers: { location: "/admin/warehouses" },
      });
    }
    return Response.json(
      { ok: true },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Склад не сохранён.";
    return fail(request, "/admin/warehouses", message, 400);
  }
}
