import { connection } from "next/server";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminCustomersPage() {
  await connection();
  await requireAdminSession("customers");
  const leads = await withDatabase(() =>
    getPrismaClient().lead.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  );
  return (
    <div>
      <AdminPageHeader
        description="Лиды (цена/редкие/контакт). Полноценный кабинет клиентов — позже."
        title="Customers"
      />
      <AdminTable
        columns={["Type", "Name", "Contact", "Article", "Status", "Created"]}
        emptyDescription="Лидов нет."
        emptyTitle="Customers пусто"
        rows={leads.map((lead) => [
          lead.type,
          lead.name,
          [lead.phone, lead.email].filter(Boolean).join(" / ") || "—",
          lead.article ?? "—",
          lead.status,
          lead.createdAt.toISOString().slice(0, 19),
        ])}
      />
    </div>
  );
}
