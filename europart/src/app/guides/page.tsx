import { connection } from "next/server";
import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/state";
import { listPublishedCmsDocuments } from "@/modules/content/public";
import { buildSeo } from "@/modules/seo/generator";
import { isIndexingEnabled } from "@/modules/seo/policy";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const items = await listPublishedCmsDocuments("GUIDE");
  const indexingEnabled = await isIndexingEnabled();
  return buildSeo({
    kind: "guide",
    vars: { headline: "Инструкции" },
    path: "/guides",
    indexingEnabled,
    hasQualityContent: items.length > 0,
  }).metadata;
}

export default async function GuidesIndexPage() {
  await connection();
  const items = await listPublishedCmsDocuments("GUIDE");
  const indexingEnabled = await isIndexingEnabled();
  const seo = buildSeo({
    kind: "guide",
    vars: { headline: "Инструкции" },
    path: "/guides",
    indexingEnabled,
    hasQualityContent: items.length > 0,
  });

  return (
    <Container className="grid gap-8 py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { label: "Инструкции" },
        ]}
      />
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{seo.h1}</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Технические инструкции. Без шаблонного автоконтента.
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          description="Опубликованных инструкций пока нет."
          title="Инструкции появятся позже"
        />
      ) : (
        <ul className="grid gap-6">
          {items.map((item) => (
            <li key={item.id}>
              <Link className="group grid gap-2" href={`/guides/${item.slug}`}>
                <h2 className="font-display text-2xl font-semibold tracking-tight group-hover:text-brand">
                  {item.title}
                </h2>
                {item.excerpt ? (
                  <p className="max-w-3xl text-ink-muted">{item.excerpt}</p>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
