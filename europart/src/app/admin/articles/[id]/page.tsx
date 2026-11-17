import { connection } from "next/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { CmsDocumentForm } from "@/components/admin/cms-document-form";
import { requireAdminSession } from "@/modules/admin/auth";
import { getCmsDocumentById } from "@/modules/content/documents";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminArticleEditPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  await requireAdminSession("articles");
  const { id } = await params;
  const document = await getCmsDocumentById(id);
  if (!document) {
    notFound();
  }
  const seo = await withDatabase(() =>
    getPrismaClient().seoMetadata.findUnique({
      where: {
        entityType_entityId: { entityType: "CMS_DOCUMENT", entityId: document.id },
      },
    }),
  );

  return (
    <div className="grid gap-8">
      <AdminPageHeader
        action={
          <Link className="text-sm font-semibold text-brand" href="/admin/articles">
            ← К списку
          </Link>
        }
        description={`${document.kind} · ${document.status} · ${document.slug}`}
        title={document.title}
      />
      <CmsDocumentForm
        initial={{
          id: document.id,
          kind: document.kind,
          status: document.status,
          slug: document.slug,
          title: document.title,
          excerpt: document.excerpt ?? "",
          body: document.body,
          coverImageUrl: document.coverImageUrl ?? "",
          authorName: document.authorName ?? "",
          reviewConfirmed: document.reviewConfirmed,
          categoryId: document.categoryId ?? "",
          vehicleBrandId: document.vehicleBrandId ?? "",
          vehicleModelId: document.vehicleModelId ?? "",
          relatedProductIds: document.relatedProducts
            .map((row) => row.productId)
            .join(", "),
          imageLines: document.images
            .map((image) =>
              image.alt ? `${image.url}|${image.alt}` : image.url,
            )
            .join("\n"),
          seoTitle: seo?.title ?? "",
          seoDescription: seo?.description ?? "",
          seoH1: seo?.h1 ?? "",
          seoRobotsMode: seo?.robotsMode ?? "AUTO",
          seoOgImageUrl: seo?.ogImageUrl ?? "",
        }}
        mode="edit"
      />
    </div>
  );
}
