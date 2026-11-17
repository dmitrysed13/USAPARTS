import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import {
  createSupplier,
  listSuppliers,
  supplierError,
} from "@/modules/inventory/suppliers";

export async function GET(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "suppliers");
  if (!gate.ok) {
    return gate.response;
  }
  const suppliers = await listSuppliers();
  return adminJson({
    suppliers: suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      code: supplier.code,
      isActive: supplier.isActive,
      currency: supplier.currency,
      importFormat: supplier.importFormat,
      apiEnabled: supplier.apiEnabled,
      offerCount: supplier._count.offers,
      warehouseCount: supplier._count.warehouses,
    })),
  });
}

export async function POST(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "suppliers");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const supplier = await createSupplier({
      name: String(body.name ?? ""),
      code: body.code ? String(body.code) : undefined,
      email: body.email ? String(body.email) : "",
      phone: body.phone ? String(body.phone) : undefined,
      website: body.website ? String(body.website) : "",
      note: body.note ? String(body.note) : undefined,
      terms: body.terms ? String(body.terms) : undefined,
      currency: body.currency ? String(body.currency) : undefined,
      importFormat: body.importFormat as "CSV" | "XLSX" | "API" | "MANUAL" | undefined,
      apiEnabled: Boolean(body.apiEnabled),
      apiBaseUrl: body.apiBaseUrl ? String(body.apiBaseUrl) : "",
      credentialsEnvKey: body.credentialsEnvKey
        ? String(body.credentialsEnvKey)
        : "",
    });
    return adminJson({ id: supplier.id }, 201);
  } catch (error) {
    try {
      return fail(request, "/api/admin/suppliers", supplierError(error), 400);
    } catch (unknownError) {
      return fail(
        request,
        "/api/admin/suppliers",
        publicError(unknownError, "Не сохранено."),
        400,
      );
    }
  }
}
