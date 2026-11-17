import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { listActiveCategories } from "@/modules/catalog/repository";

export default async function AdminCategoriesPage() {
  await connection();
  await requireAdminSession("categories");
  const categories = await listActiveCategories();
  return (
    <div>
      <AdminPageHeader
        description="Активные категории. Создание — POST /api/admin/categories."
        title="Categories"
      />
      <AdminTable
        columns={["Название", "Slug", "Parent"]}
        emptyDescription="Категории появятся после seed/миграции или ручного добавления."
        emptyTitle="Категорий нет"
        rows={categories.map((category) => [
          category.name,
          category.slug,
          category.parentId ?? "—",
        ])}
      />
      <AdminApiHint path="/api/admin/categories" />
    </div>
  );
}
