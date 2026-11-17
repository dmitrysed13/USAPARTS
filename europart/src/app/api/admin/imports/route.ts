import { connection } from "next/server";
import { requireAdminApi } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { ImportService } from "@/modules/imports/service";
import type { ImportDelimiter } from "@/modules/imports/parser";
import { getPrismaClient } from "@/lib/db/prisma";

export async function GET(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  const jobs = await getPrismaClient().importJob.findMany({
    orderBy: { createdAt: "desc" },
    take: 50,
    select: {
      id: true,
      filename: true,
      status: true,
      sourceType: true,
      supplierId: true,
      warehouseId: true,
      summary: true,
      createdAt: true,
      updatedAt: true,
    },
  });
  return adminJson({ jobs });
}

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
    const source = String(form.get("sourceType") ?? "");
    const delimiterText = String(form.get("delimiter") ?? "");
    const delimiter: ImportDelimiter =
      delimiterText === "comma" || delimiterText === "semicolon"
        ? delimiterText
        : "auto";
    const job = await ImportService.upload({
      filename: file.name || "price.csv",
      bytes: new Uint8Array(await file.arrayBuffer()),
      delimiter,
      sourceType: source === "OWN_STOCK" ? "OWN_STOCK" : "SUPPLIER",
      supplierId: String(form.get("supplierId") ?? "") || null,
      warehouseId: String(form.get("warehouseId") ?? "") || null,
      templateId: String(form.get("templateId") ?? "") || null,
    });
    return adminJson({ id: job.id }, 201);
  } catch (error) {
    return fail(
      request,
      "/api/admin/imports",
      publicError(error, "Файл не принят."),
      400,
    );
  }
}
