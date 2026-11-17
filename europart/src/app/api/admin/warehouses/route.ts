import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { createWarehouse, listWarehouses } from "@/modules/inventory/warehouses";

export async function GET(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "warehouses");
  if (!gate.ok) {
    return gate.response;
  }
  const warehouses = await listWarehouses();
  return adminJson({
    warehouses: warehouses.map((warehouse) => ({
      id: warehouse.id,
      name: warehouse.name,
      code: warehouse.code,
      type: warehouse.type,
      city: warehouse.city,
      address: warehouse.address,
      isActive: warehouse.isActive,
      stockUpdatedAt: warehouse.stockUpdatedAt,
      supplier: warehouse.supplier,
    })),
  });
}

export async function POST(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "warehouses");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const warehouse = await createWarehouse({
      name: String(body.name ?? ""),
      code: body.code ? String(body.code) : undefined,
      type: body.type === "SUPPLIER" ? "SUPPLIER" : "OWN",
      supplierId: body.supplierId ? String(body.supplierId) : null,
      city: body.city ? String(body.city) : undefined,
      address: body.address ? String(body.address) : undefined,
    });
    return adminJson({ id: warehouse.id }, 201);
  } catch (error) {
    return fail(request, "/api/admin/warehouses", publicError(error, "Не сохранено."), 400);
  }
}
