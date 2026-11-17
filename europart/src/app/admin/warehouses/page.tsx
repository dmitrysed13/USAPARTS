import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { listWarehouses } from "@/modules/inventory/warehouses";

export default async function AdminWarehousesPage() {
  await connection();
  await requireAdminSession("warehouses");
  const warehouses = await listWarehouses();
  return (
    <div>
      <AdminPageHeader description="Склады." title="Warehouses" />
      <AdminTable
        columns={["Name", "Type", "Active", "Supplier"]}
        emptyDescription="Склады не заведены."
        emptyTitle="Warehouses пусто"
        rows={warehouses.map((warehouse) => [
          warehouse.name,
          warehouse.type,
          warehouse.isActive ? "yes" : "no",
          warehouse.supplier?.name ?? "—",
        ])}
      />
      <AdminApiHint path="/api/admin/warehouses" />
    </div>
  );
}
