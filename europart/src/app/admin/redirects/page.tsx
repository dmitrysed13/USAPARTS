import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { RedirectForm } from "@/components/admin/redirect-form";
import { requireAdminSession } from "@/modules/admin/auth";
import { listRedirectRules } from "@/modules/admin/redirects";

export default async function AdminRedirectsPage() {
  await connection();
  await requireAdminSession("redirects");
  const rules = await listRedirectRules();

  return (
    <div className="grid gap-8">
      <AdminPageHeader
        description="CRUD правил готов. Применение редиректов на витрине — SEO-этап."
        title="Redirects"
      />
      <RedirectForm />
      <AdminTable
        columns={["From", "To", "Active", "Note", "Created"]}
        emptyDescription="Правил нет."
        emptyTitle="Redirects пусто"
        rows={rules.map((row) => [
          row.fromPath,
          row.toPath,
          row.isActive ? "yes" : "no",
          row.note ?? "—",
          row.createdAt.toISOString().slice(0, 19),
        ])}
      />
      <AdminApiHint path="/api/admin/redirects" />
    </div>
  );
}
