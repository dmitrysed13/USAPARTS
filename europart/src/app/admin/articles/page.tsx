import { connection } from "next/server";
import { AdminPageHeader, AdminStub } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";

export default async function AdminArticlesPage() {
  await connection();
  await requireAdminSession("articles");
  return (
    <div>
      <AdminPageHeader
        description="Структурный раздел. CMS статей — отдельный этап."
        title="Articles"
      />
      <AdminStub nextStage="CMS" title="Articles" />
    </div>
  );
}
