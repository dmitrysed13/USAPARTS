import { connection } from "next/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ContentBody } from "@/components/content/content-body";
import { JsonLdScript } from "@/components/seo/json-ld";
import { InternalLinks } from "@/components/seo/internal-links";
import { Container } from "@/components/ui/container";
import { closedMetadata } from "@/lib/seo/closed";
import {
  getPublishedCmsDocument,
  relatedProductLinks,
} from "@/modules/content/public";
import { buildSeo } from "@/modules/seo/generator";
import { readSeoOverlay } from "@/modules/seo/overlay";
import { isIndexingEnabled } from "@/modules/seo/policy";
import { articleJsonLd, breadcrumbJsonLd } from "@/modules/seo/schema";

export const instant = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const document = await getPublishedCmsDocument("ARTICLE", slug);
  if (!document) {
    return closedMetadata({ title: "Статья", canonical: "/blog" });
  }
  const path = `/blog/${document.slug}`;
  const overlay = await readSeoOverlay("CMS_DOCUMENT", document.id, {
    title: document.title,
    description: document.excerpt,
    canonicalPath: path,
  });
  const indexingEnabled = await isIndexingEnabled();
  return buildSeo({
    kind: "article",
    vars: { headline: document.title },
    path,
    indexingEnabled,
    hasQualityContent: true,
    overlay,
    ogImageUrl: document.coverImageUrl ?? overlay.ogImageUrl,
    robotsMode: overlay.robotsMode,
  }).metadata;
}

export default async function BlogArticlePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const document = await getPublishedCmsDocument("ARTICLE", slug);
  if (!document) {
    notFound();
  }
  const path = `/blog/${document.slug}`;
  const overlay = await readSeoOverlay("CMS_DOCUMENT", document.id, {
    title: document.title,
    description: document.excerpt,
    canonicalPath: path,
  });
  const indexingEnabled = await isIndexingEnabled();
  const seo = buildSeo({
    kind: "article",
    vars: { headline: document.title },
    path,
    indexingEnabled,
    hasQualityContent: true,
    overlay,
    ogImageUrl: document.coverImageUrl ?? overlay.ogImageUrl,
    robotsMode: overlay.robotsMode,
  });
  const related = relatedProductLinks(document);

  return (
    <Container className="grid gap-8 py-10">
      <JsonLdScript
        data={[
          breadcrumbJsonLd([
            { name: "Главная", path: "/" },
            { name: "Статьи", path: "/blog" },
            { name: document.title, path },
          ]),
          articleJsonLd({
            headline: seo.h1,
            path,
            description: document.excerpt ?? seo.description,
            datePublished: document.publishedAt?.toISOString() ?? null,
            dateModified: document.updatedAt.toISOString(),
            authorName: document.authorName,
            imageUrl: document.coverImageUrl,
          }),
        ]}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { href: "/blog", label: "Статьи" },
          { label: document.title },
        ]}
      />
      <article className="grid max-w-3xl gap-6">
        <header className="grid gap-3">
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            {seo.h1}
          </h1>
          <p className="text-sm text-ink-muted">
            {[
              document.authorName,
              document.publishedAt
                ? document.publishedAt.toISOString().slice(0, 10)
                : null,
            ]
              .filter(Boolean)
              .join(" · ")}
          </p>
          {document.excerpt ? (
            <p className="text-lg leading-7 text-ink-muted">{document.excerpt}</p>
          ) : null}
        </header>
        {document.coverImageUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={document.title}
            className="w-full rounded-2xl border border-line object-cover"
            src={document.coverImageUrl}
          />
        ) : null}
        <ContentBody body={document.body} />
        {document.images.length > 0 ? (
          <ul className="grid gap-4">
            {document.images.map((image) => (
              <li key={image.id}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  alt={image.alt ?? document.title}
                  className="w-full rounded-2xl border border-line object-cover"
                  src={image.url}
                />
              </li>
            ))}
          </ul>
        ) : null}
        {seo.seoText ? (
          <p className="text-sm leading-6 text-ink-muted">{seo.seoText}</p>
        ) : null}
      </article>
      <InternalLinks links={related} title="Связанные товары" />
    </Container>
  );
}
