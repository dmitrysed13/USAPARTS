import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { ImportForm } from "@/components/admin/import-form";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminImportPage() {
  await connection();
  await requireAdminSession("import");
  const [jobs, suppliers, warehouses] = await withDatabase(async () => {
    const prisma = getPrismaClient();
    return Promise.all([
      prisma.importJob.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          filename: true,
          status: true,
          sourceType: true,
          createdAt: true,
          supplier: { select: { name: true } },
          warehouse: { select: { name: true } },
        },
      }),
      prisma.supplier.findMany({
        where: { isActive: true },
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
      prisma.warehouse.findMany({
        orderBy: { name: "asc" },
        select: { id: true, name: true },
      }),
    ]);
  });

  return (
    <div className="grid gap-8">
      <AdminPageHeader
        description="Excel/CSV прайс. Без файла и реальных строк каталог не наполняется."
        title="Excel import"
      />
      <ImportForm suppliers={suppliers} warehouses={warehouses} />
      <AdminTable
        columns={["File", "Status", "Source", "Supplier", "Warehouse", "Created"]}
        emptyDescription="Импортов ещё не было."
        emptyTitle="Import пусто"
        rows={jobs.map((job) => [
          job.filename,
          job.status,
          job.sourceType,
          job.supplier?.name ?? "—",
          job.warehouse?.name ?? "—",
          job.createdAt.toISOString().slice(0, 19),
        ])}
      />
      <AdminApiHint path="/api/admin/imports" />
    </div>
  );
}
