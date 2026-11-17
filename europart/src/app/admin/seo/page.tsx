import { connection } from "next/server";
import { AdminPageHeader, AdminStub } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";

export default async function AdminSeoPage() {
  await connection();
  await requireAdminSession("seo");
  return (
    <div>
      <AdminPageHeader
        description="Структурный раздел. SEO-движок и шаблоны мета — отдельный этап."
        title="SEO"
      />
      <AdminStub nextStage="SEO engine" title="SEO" />
    </div>
  );
}
