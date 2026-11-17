import { connection } from "next/server";
import Link from "next/link";
import {
  AdminApiHint,
  AdminPageHeader,
  AdminTable,
} from "@/components/admin/admin-page";
import { CmsDocumentForm } from "@/components/admin/cms-document-form";
import { buttonClassName } from "@/components/ui/button";
import { requireAdminSession } from "@/modules/admin/auth";
import { listCmsDocuments } from "@/modules/content/documents";
import {
  contentKindLabels,
  contentStatusLabels,
} from "@/modules/content/labels";
import { cmsPublicPath } from "@/modules/content/paths";

export default async function AdminArticlesPage() {
  await connection();
  await requireAdminSession("articles");
  const documents = await listCmsDocuments();

  return (
    <div className="grid gap-10">
      <AdminPageHeader
        description="CMS: статьи, инструкции, FAQ, отзывы, контент категорий/авто. Пустой CMS допустим — спам не генерируется. SEO metadata пишется в SeoMetadata (CMS_DOCUMENT)."
        title="Articles / CMS"
      />
      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Новый материал</h2>
        <CmsDocumentForm mode="create" />
      </section>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Материалы</h2>
        <AdminTable
          columns={["Title", "Kind", "Status", "Slug", "Published", ""]}
          emptyDescription="Материалов нет — это нормально. Не заполняйте шаблонным SEO-текстом."
          emptyTitle="CMS пусто"
          rows={documents.map((row) => {
            const path = cmsPublicPath(row.kind, row.slug);
            return [
              row.title,
              contentKindLabels[row.kind],
              contentStatusLabels[row.status],
              path ?? row.slug,
              row.publishedAt ? row.publishedAt.toISOString().slice(0, 10) : "—",
              <Link
                className={buttonClassName("secondary")}
                href={`/admin/articles/${row.id}`}
                key={row.id}
              >
                Edit
              </Link>,
            ];
          })}
        />
      </section>
      <AdminApiHint path="/api/admin/articles" />
    </div>
  );
}
