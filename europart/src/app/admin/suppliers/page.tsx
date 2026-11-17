import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { listSuppliers } from "@/modules/inventory/suppliers";

export default async function AdminSuppliersPage() {
  await connection();
  await requireAdminSession("suppliers");
  const suppliers = await listSuppliers();
  return (
    <div>
      <AdminPageHeader description="Поставщики из §5 API." title="Suppliers" />
      <AdminTable
        columns={["Name", "Code", "Active", "Offers", "Warehouses"]}
        emptyDescription="Поставщики не заведены."
        emptyTitle="Suppliers пусто"
        rows={suppliers.map((supplier) => [
          supplier.name,
          supplier.code,
          supplier.isActive ? "yes" : "no",
          String(supplier._count.offers),
          String(supplier._count.warehouses),
        ])}
      />
      <AdminApiHint path="/api/admin/suppliers" />
    </div>
  );
}
