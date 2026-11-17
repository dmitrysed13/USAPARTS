import { connection } from "next/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ProductGrid } from "@/components/catalog/product-card";
import { JsonLdScript } from "@/components/seo/json-ld";
import { Container } from "@/components/ui/container";
import { listPublishedProductsByOem } from "@/modules/catalog/repository";
import { buildSeo } from "@/modules/seo/generator";
import { isIndexingEnabled } from "@/modules/seo/policy";
import { breadcrumbJsonLd } from "@/modules/seo/schema";
import { applySeoTemplate } from "@/modules/seo/templates";

type Params = { params: Promise<{ oem: string }> };

export const instant = false;

export async function generateMetadata({ params }: Params): Promise<Metadata> {
  await connection();
  const { oem: oemParam } = await params;
  const { oem, items } = await listPublishedProductsByOem(decodeURIComponent(oemParam));
  if (items.length === 0) {
    return { title: "OEM", robots: { index: false, follow: false } };
  }
  const path = `/oem/${encodeURIComponent(oem)}`;
  const indexingEnabled = await isIndexingEnabled();
  return buildSeo({
    kind: "oem",
    vars: { oem },
    path,
    indexingEnabled,
    hasQualityContent: true,
  }).metadata;
}

export default async function OemPage({ params }: Params) {
  await connection();
  const { oem: oemParam } = await params;
  const { oem, items } = await listPublishedProductsByOem(decodeURIComponent(oemParam));
  if (items.length === 0) {
    notFound();
  }
  const path = `/oem/${encodeURIComponent(oem)}`;
  const tpl = applySeoTemplate("oem", { oem });

  return (
    <Container className="grid gap-8 py-10">
      <JsonLdScript
        data={breadcrumbJsonLd([
          { name: "Главная", path: "/" },
          { name: "Каталог", path: "/catalog" },
          { name: `OEM ${oem}`, path },
        ])}
      />
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { href: "/catalog", label: "Каталог" },
          { label: `OEM ${oem}` },
        ]}
      />
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">{tpl.h1}</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">{tpl.description}</p>
      </div>
      <ProductGrid
        emptyDescription="Нет позиций."
        emptyTitle="Пусто"
        items={items}
      />
      <p className="text-sm text-ink-muted">
        <Link className="font-semibold text-brand" href="/catalog">
          ← В каталог
        </Link>
      </p>
    </Container>
  );
}
