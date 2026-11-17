import { connection } from "next/server";
import type { Metadata } from "next";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ContentBody } from "@/components/content/content-body";
import { JsonLdScript } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/state";
import { listPublishedCmsDocuments } from "@/modules/content/public";
import { buildSeo } from "@/modules/seo/generator";
import { isIndexingEnabled } from "@/modules/seo/policy";
import { breadcrumbJsonLd, faqPageJsonLd } from "@/modules/seo/schema";

export const instant = false;

export async function generateMetadata(): Promise<Metadata> {
  await connection();
  const items = await listPublishedCmsDocuments("FAQ");
  const indexingEnabled = await isIndexingEnabled();
  return buildSeo({
    kind: "faq",
    vars: {},
    path: "/faq",
    indexingEnabled,
    hasQualityContent: items.length > 0,
  }).metadata;
}

export default async function FaqPage() {
  await connection();
  const items = await listPublishedCmsDocuments("FAQ");
  const indexingEnabled = await isIndexingEnabled();
  const seo = buildSeo({
    kind: "faq",
    vars: {},
    path: "/faq",
    indexingEnabled,
    hasQualityContent: items.length > 0,
  });
  const faqLd = faqPageJsonLd(
    items.map((item) => ({ question: item.title, answer: item.body })),
  );

  return (
    <Container className="grid gap-8 py-10">
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Главная", path: "/" },
            { name: "FAQ", path: "/faq" },
          ]),
          ...(faqLd ? [faqLd] : []),
        ]}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { label: "FAQ" },
        ]}
      />
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{seo.h1}</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Реальные ответы. FAQPage schema только при валидных Q&A.
        </p>
      </div>
      {items.length === 0 ? (
        <EmptyState
          description="Опубликованных вопросов пока нет."
          title="FAQ пуст"
        />
      ) : (
        <ul className="grid max-w-3xl gap-8">
          {items.map((item) => (
            <li className="grid gap-3" id={item.slug} key={item.id}>
              <h2 className="font-display text-2xl font-semibold tracking-tight">
                {item.title}
              </h2>
              <ContentBody body={item.body} />
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
