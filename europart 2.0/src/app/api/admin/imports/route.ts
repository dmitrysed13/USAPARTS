import { connection } from "next/server";
import { requireAdminApi } from "@/modules/admin/guard";
import { fail, formText, wantsHtml } from "@/modules/admin/respond";
import { ImportService } from "@/modules/imports/service";
import type { ImportDelimiter } from "@/modules/imports/parser";

export async function POST(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const form = await request.formData();
    const file = form.get("file");
    if (!(file instanceof File)) {
      throw new Error("Выберите файл прайса.");
    }
    const source = formText(form, "sourceType");
    const delimiterText = formText(form, "delimiter");
    const delimiter: ImportDelimiter =
      delimiterText === "comma" || delimiterText === "semicolon" ? delimiterText : "auto";
    const job = await ImportService.upload({
      filename: file.name || "price.csv",
      bytes: new Uint8Array(await file.arrayBuffer()),
      delimiter,
      sourceType: source === "OWN_STOCK" ? "OWN_STOCK" : "SUPPLIER",
      supplierId: formText(form, "supplierId") || null,
      warehouseId: formText(form, "warehouseId") || null,
      templateId: formText(form, "templateId") || null,
    });
    if (wantsHtml(request)) {
      return new Response(null, {
        status: 303,
        headers: { location: `/admin/imports/${job.id}` },
      });
    }
    return Response.json(
      { id: job.id },
      { status: 201, headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Файл не принят.";
    return fail(request, "/admin/imports/new", message, 400);
  }
}
