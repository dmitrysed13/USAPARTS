import { connection } from "next/server";
import { requireAdminApi } from "@/modules/admin/guard";
import { fail, formText, wantsHtml } from "@/modules/admin/respond";
import {
  deactivateSupplier,
  supplierError,
  updateSupplier,
} from "@/modules/admin/suppliers";

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
  const back = `/admin/suppliers/${id}`;
  try {
    const form = await request.formData();
    if (formText(form, "intent") === "deactivate") {
      await deactivateSupplier(id);
    } else {
      await updateSupplier(id, {
        name: formText(form, "name"),
        code: formText(form, "code"),
        email: formText(form, "email"),
        phone: formText(form, "phone"),
        note: formText(form, "note"),
        apiEnabled: form.get("apiEnabled") === "on" || form.get("apiEnabled") === "true",
        credentialsEnvKey: formText(form, "credentialsEnvKey"),
        isActive: form.get("isActive") === "on" || form.get("isActive") === "true",
      });
    }
    if (wantsHtml(request)) {
      return new Response(null, { status: 303, headers: { location: back } });
    }
    return Response.json({ ok: true }, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    try {
      return fail(request, back, supplierError(error), 400);
    } catch (unknownError) {
      const message =
        unknownError instanceof Error ? unknownError.message : "Не сохранено.";
      return fail(request, back, message, 400);
    }
  }
}
