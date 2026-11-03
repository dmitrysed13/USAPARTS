import { connection } from "next/server";
import { getPrismaClient } from "@/lib/db/prisma";
import { requireAdminApi } from "@/modules/admin/guard";
import { adminJson, fail, formText, wantsHtml } from "@/modules/admin/respond";
import { ImportService } from "@/modules/imports/service";

function mappingFromForm(form: FormData): Record<string, string> {
  const headers = form.getAll("header").map((value) => String(value));
  const fields = form.getAll("field").map((value) => String(value));
  return Object.fromEntries(
    headers.map((header, index) => [header, fields[index] ?? ""]),
  );
}

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
  const back = `/admin/imports/${id}`;
  try {
    const type = request.headers.get("content-type") ?? "";
    const payload = type.includes("application/json")
      ? ((await request.json()) as {
          intent?: string;
          mapping?: Record<string, string>;
          templateName?: string;
        })
      : null;
    const form = payload ? null : await request.formData();
    const intent = payload?.intent ?? (form ? formText(form, "intent") : "");
    const job = await getPrismaClient().importJob.findUnique({ where: { id } });
    if (!job) {
      return fail(request, "/admin/imports/new", "Импорт не найден.", 404);
    }
    if (intent === "commit") {
      const summary = await ImportService.commit(id);
      return wantsHtml(request)
        ? new Response(null, { status: 303, headers: { location: back } })
        : adminJson({ summary });
    }
    if (intent === "rollback") {
      const summary = await ImportService.rollback(id);
      return wantsHtml(request)
        ? new Response(null, { status: 303, headers: { location: back } })
        : adminJson({ summary });
    }
    const headers = Array.isArray(job.headers)
      ? job.headers.filter((item) => typeof item === "string")
      : [];
    const mapping = payload?.mapping ?? (form ? mappingFromForm(form) : {});
    if (intent === "template") {
      if (!job.supplierId) {
        throw new Error("Шаблон сохраняется для поставщика, не для собственного склада.");
      }
      const name = payload?.templateName ?? (form ? formText(form, "templateName") : "");
      await ImportService.saveTemplate({
        supplierId: job.supplierId,
        name,
        mapping,
        headers,
        delimiter: "auto",
      });
      return wantsHtml(request)
        ? new Response(null, { status: 303, headers: { location: back } })
        : adminJson({ ok: true });
    }
    const summary = await ImportService.preview(id, mapping);
    const templateName =
      payload?.templateName ?? (form ? formText(form, "templateName") : "");
    if (templateName && job.supplierId) {
      await ImportService.saveTemplate({
        supplierId: job.supplierId,
        name: templateName,
        mapping,
        headers,
        delimiter: "auto",
      });
    }
    return wantsHtml(request)
      ? new Response(null, { status: 303, headers: { location: back } })
      : adminJson({ summary });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Импорт не выполнен.";
    return fail(request, back, message, 400);
  }
}
