import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { ImportService } from "@/modules/imports/service";
import { ImportReportService } from "@/modules/imports/report";
import { getPrismaClient } from "@/lib/db/prisma";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  await connection();
  const gate = await requireAdminApiAsync(request, "import");
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await params;
  const job = await getPrismaClient().importJob.findUnique({
    where: { id },
    include: {
      rows: { orderBy: { rowNumber: "asc" }, take: 200 },
      supplier: { select: { id: true, name: true, code: true } },
      warehouse: { select: { id: true, name: true, code: true } },
    },
  });
  if (!job) {
    return adminJson({ message: "Импорт не найден." }, 404);
  }
  return adminJson({
    job: {
      id: job.id,
      filename: job.filename,
      status: job.status,
      sourceType: job.sourceType,
      headers: job.headers,
      mapping: job.mapping,
      summary: job.summary,
      supplier: job.supplier,
      warehouse: job.warehouse,
      createdAt: job.createdAt,
      updatedAt: job.updatedAt,
      rows: job.rows.map((row) => ({
        rowNumber: row.rowNumber,
        action: row.action,
        message: row.message,
        productId: row.productId,
        offerId: row.offerId,
        applied: row.applied,
        normalized: row.normalized,
      })),
      report: ImportReportService.read(job.summary),
    },
  });
}

export async function POST(request: Request, { params }: Params) {
  await connection();
  const gate = await requireAdminApiAsync(request, "import");
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await params;
  try {
    const body = (await request.json()) as { action?: string; mapping?: unknown };
    if (body.action === "preview") {
      const summary = await ImportService.preview(id, body.mapping ?? {});
      return adminJson({ summary });
    }
    if (body.action === "commit") {
      const summary = await ImportService.commit(id);
      return adminJson({ summary });
    }
    if (body.action === "rollback") {
      const summary = await ImportService.rollback(id);
      return adminJson({ summary });
    }
    throw new Error("Укажите action: preview | commit | rollback.");
  } catch (error) {
    return fail(
      request,
      `/api/admin/imports/${id}`,
      publicError(error, "Операция импорта не выполнена."),
      400,
    );
  }
}
