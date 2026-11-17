import { connection } from "next/server";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminB2bPage() {
  await connection();
  await requireAdminSession("b2b");
  const leads = await withDatabase(() =>
    getPrismaClient().lead.findMany({
      where: { type: "B2B" },
      orderBy: { createdAt: "desc" },
      take: 100,
    }),
  );
  return (
    <div>
      <AdminPageHeader description="B2B-заявки. Оптовый кабинет — отдельный этап." title="B2B" />
      <AdminTable
        columns={["Name", "Contact", "Message", "Status", "Created"]}
        emptyDescription="B2B-заявок нет."
        emptyTitle="B2B пусто"
        rows={leads.map((lead) => [
          lead.name,
          [lead.phone, lead.email].filter(Boolean).join(" / ") || "—",
          lead.message ?? "—",
          lead.status,
          lead.createdAt.toISOString().slice(0, 19),
        ])}
      />
    </div>
  );
}
