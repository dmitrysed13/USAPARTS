import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminIntegrationsPage() {
  await connection();
  await requireAdminSession("integrations");
  const suppliers = await withDatabase(() =>
    getPrismaClient().supplier.findMany({
      orderBy: { name: "asc" },
      select: {
        id: true,
        name: true,
        code: true,
        apiEnabled: true,
        apiBaseUrl: true,
        credentialsEnvKey: true,
        isActive: true,
        _count: { select: { syncLogs: true } },
      },
    }),
  );
  return (
    <div>
      <AdminPageHeader
        description="Порты поставщиков/оплаты/почты. Без ключей — fail closed, фейковых sync-успехов нет."
        title="API integrations"
      />
      <AdminTable
        columns={["Name", "Code", "API", "Base URL", "Env key", "Sync logs", "Active"]}
        emptyDescription="Поставщиков нет — добавьте через /admin/suppliers или API."
        emptyTitle="Integrations пусто"
        rows={suppliers.map((row) => [
          row.name,
          row.code,
          row.apiEnabled ? "enabled" : "off",
          row.apiBaseUrl ?? "—",
          row.credentialsEnvKey ?? "—",
          String(row._count.syncLogs),
          row.isActive ? "yes" : "no",
        ])}
      />
      <AdminApiHint path="/api/admin/suppliers" />
    </div>
  );
}
