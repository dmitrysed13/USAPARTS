import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminVehiclesModelsPage() {
  await connection();
  await requireAdminSession("vehicles");
  const rows = await withDatabase(() =>
    getPrismaClient().vehicleModel.findMany({
      orderBy: { name: "asc" },
      take: 200,
      select: { id: true, name: true, slug: true, isActive: true },
    }),
  );
  return (
    <div>
      <AdminPageHeader
        description="Справочник. Добавление через admin vehicles API."
        title="Models"
      />
      <AdminTable
        columns={["Name", "Slug", "Active"]}
        emptyDescription="Пусто — норма до наполнения справочника."
        emptyTitle="Models: нет записей"
        rows={rows.map((row) => [row.name, row.slug, row.isActive ? "yes" : "no"])}
      />
      <AdminApiHint path="/api/admin/vehicles/models" />
    </div>
  );
}
