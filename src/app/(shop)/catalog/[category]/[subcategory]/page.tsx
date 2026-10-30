import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { listProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { listingMetadata } from "@/lib/listing-meta";
import { toFilters } from "@/lib/query";
import { seoFromTemplate } from "@/lib/seo";

export const revalidate = 300;

async function load(category: string, subcategory: string, searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const child = await prisma.category.findFirst({
    where: { slug: subcategory, isActive: true, parent: { slug: category } },
    include: { parent: true },
  });
  if (!child?.parent) notFound();
  const filters = toFilters(await searchParams, { category: subcategory });
  const result = await listProducts(filters);
  if ((filters.page ?? 1) > result.pages && result.total > 0) notFound();
  return { child, filters, result };
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ category: string; subcategory: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { category, subcategory } = await params;
  const { child, filters, result } = await load(category, subcategory, searchParams);
  const seo = await seoFromTemplate("category", { name: child.name, count: result.total }, { title: child.seoTitle, description: child.seoDescription });
  return listingMetadata({ title: seo.title, description: seo.description, path: `/catalog/${category}/${subcategory}`, filters, total: result.total });
}

export default async function SubcategoryPage({ params, searchParams }: { params: Promise<{ category: string; subcategory: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { category, subcategory } = await params;
  const { child, filters, result } = await load(category, subcategory, searchParams);
  return (
    <CatalogView
      title={child.name}
      intro={child.intro}
      base={`/catalog/${category}/${subcategory}`}
      items={result.items}
      total={result.total}
      page={result.page}
      pages={result.pages}
      crumbs={[
        { name: "Главная", href: "/" },
        { name: "Каталог", href: "/catalog" },
        { name: child.parent!.name, href: `/catalog/${category}` },
        { name: child.name },
      ]}
      sort={filters.sort}
      availability={filters.availability}
      condition={filters.condition}
    />
  );
}
