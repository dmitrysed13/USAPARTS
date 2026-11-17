import { connection } from "next/server";
import Link from "next/link";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminVinLeadsPage() {
  await connection();
  await requireAdminSession("vin");
  const rows = await withDatabase(() =>
    getPrismaClient().vinRequest.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        vin: true,
        status: true,
        customerName: true,
        phone: true,
        partName: true,
        createdAt: true,
        _count: { select: { history: true } },
      },
    }),
  );
  return (
    <div>
      <AdminPageHeader description="VIN-заявки с историей. Без фейковой расшифровки." title="VIN leads" />
      <AdminTable
        columns={["VIN", "Status", "Customer", "Part", "History", "Created"]}
        emptyDescription="VIN-заявок нет."
        emptyTitle="VIN пусто"
        rows={rows.map((row) => [
          <Link className="font-medium text-brand" href={`/admin/vin-leads/${row.id}`} key={row.id}>
            {row.vin}
          </Link>,
          row.status,
          row.customerName,
          row.partName ?? "—",
          String(row._count.history),
          row.createdAt.toISOString().slice(0, 19),
        ])}
      />
      <AdminApiHint path="/api/admin/vin-requests" />
    </div>
  );
}
