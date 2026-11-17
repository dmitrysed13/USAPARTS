import { connection } from "next/server";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ContentBody } from "@/components/content/content-body";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/state";
import { listPublishedCmsDocuments } from "@/modules/content/public";
import { buildSeo } from "@/modules/seo/generator";
import { isIndexingEnabled } from "@/modules/seo/policy";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const items = await listPublishedCmsDocuments("REVIEW");
  const indexingEnabled = await isIndexingEnabled();
  return buildSeo({
    kind: "review",
    vars: {},
    path: "/reviews",
    indexingEnabled,
    hasQualityContent: items.length > 0,
  }).metadata;
}

export default async function ReviewsPage() {
  await connection();
  const items = await listPublishedCmsDocuments("REVIEW");
  const indexingEnabled = await isIndexingEnabled();
  const seo = buildSeo({
    kind: "review",
    vars: {},
    path: "/reviews",
    indexingEnabled,
    hasQualityContent: items.length > 0,
  });

  return (
    <Container className="grid gap-8 py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { label: "Отзывы" },
        ]}
      />
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{seo.h1}</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Только подтверждённые отзывы. Без AggregateRating и выдуманных оценок.
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          description="Подтверждённых отзывов пока нет."
          title="Отзывы появятся после проверки"
        />
      ) : (
        <ul className="grid max-w-3xl gap-8">
          {items.map((item) => (
            <li
              className="grid gap-3 border-b border-line pb-8 last:border-0"
              id={item.slug}
              key={item.id}
            >
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {item.title}
              </h2>
              {item.authorName ? (
                <p className="text-sm text-ink-muted">{item.authorName}</p>
              ) : null}
              <ContentBody body={item.body} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
