import { connection } from "next/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import { Container } from "@/components/ui/container";
import { closedMetadata } from "@/lib/seo/closed";
import { catalogHref, parseCatalogFilters } from "@/modules/catalog/filters";
import {
  getCategoryPageContext,
  listPartBrandsForProducts,
  listPublishedProducts,
} from "@/modules/catalog/repository";
import { readSeoOverlay } from "@/modules/seo/overlay";

async function loadCategory(slug: string) {
  return getCategoryPageContext(slug);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ category: string }>;
}): Promise<Metadata> {
  await connection();
  const { category: slug } = await params;
  const context = await loadCategory(slug);
  if (!context) {
    return closedMetadata({ title: "Категория", canonical: "/catalog" });
  }
  const seo = await readSeoOverlay("CATEGORY", context.category.id, {
    title: context.category.name,
    description: context.category.description,
    canonicalPath: `/catalog/${context.category.slug}`,
  });
  return closedMetadata({
    title: seo.title,
    description: seo.description,
    canonical: seo.canonicalPath,
  });
}

export default async function CategoryPage({
  params,
  searchParams,
}: {
  params: Promise<{ category: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { category: slug } = await params;
  const context = await loadCategory(slug);
  if (!context) {
    notFound();
  }

  const filters = parseCatalogFilters(await searchParams);
  const scope = { categoryId: { in: context.categoryIds } };
  const [page, partBrands, seo] = await Promise.all([
    listPublishedProducts(filters, scope),
    listPartBrandsForProducts(scope),
    readSeoOverlay("CATEGORY", context.category.id, {
      title: context.category.name,
      description: context.category.description,
      canonicalPath: `/catalog/${context.category.slug}`,
    }),
  ]);
  const path = `/catalog/${context.category.slug}`;

  return (
    <Container className="grid gap-8 py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { href: "/catalog", label: "Каталог" },
          ...context.breadcrumb.slice(0, -1).map((item) => ({
            href: `/catalog/${item.slug}`,
            label: item.name,
          })),
          { label: context.breadcrumb.at(-1)?.name ?? context.category.name },
        ]}
      />
      <div>
        <h1 className="break-words font-display text-4xl font-semibold tracking-tight">
          {seo.h1}
        </h1>
        {context.category.description ? (
          <p className="mt-3 max-w-3xl leading-7 text-ink-muted">
            {context.category.description}
          </p>
        ) : null}
      </div>
      {context.children.length > 0 ? (
        <ul className="flex flex-wrap gap-2">
          {context.children.map((child) => (
            <li key={child.id}>
              <Link
                className="inline-flex rounded-full border border-line px-3 py-2 text-sm font-semibold hover:border-brand"
                href={`/catalog/${child.slug}`}
              >
                {child.name}
              </Link>
            </li>
          ))}
        </ul>
      ) : null}
      <CatalogFilters action={path} filters={filters} partBrands={partBrands} />
      <ProductGrid
        emptyDescription="В этой категории нет опубликованных товаров по выбранным условиям."
        emptyTitle="Товаров нет"
        items={page.items}
      />
      <Pagination
        hrefFor={(nextPage) => catalogHref(path, filters, nextPage)}
        page={page.page}
        pageSize={page.pageSize}
        total={page.total}
      />
    </Container>
  );
}
