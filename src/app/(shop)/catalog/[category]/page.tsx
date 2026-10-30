import { notFound } from "next/navigation";
import Link from "next/link";
import { CatalogView } from "@/components/catalog-view";
import { prisma } from "@/lib/db";
import { listProducts } from "@/lib/catalog";
import { listingMetadata } from "@/lib/listing-meta";
import { toFilters } from "@/lib/query";
import { seoFromTemplate } from "@/lib/seo";

export const revalidate = 300;

async function load(slug: string, searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const category = await prisma.category.findFirst({ where: { slug, parentId: null, isActive: true }, include: { children: { orderBy: { sortOrder: "asc" } } } });
  if (!category) notFound();
  const filters = toFilters(await searchParams, { category: slug });
  const result = await listProducts(filters);
  if ((filters.page ?? 1) > result.pages && result.total > 0) notFound();
  return { category, filters, result };
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { category: slug } = await params;
  const { category, filters, result } = await load(slug, searchParams);
  const seo = await seoFromTemplate("category", { name: category.name, count: result.total }, { title: category.seoTitle, description: category.seoDescription });
  return listingMetadata({ title: seo.title, description: seo.description, path: `/catalog/${slug}`, filters, total: result.total });
}

export default async function CategoryPage({ params, searchParams }: { params: Promise<{ category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { category: slug } = await params;
  const { category, filters, result } = await load(slug, searchParams);
  return (
    <CatalogView
      title={category.name}
      intro={category.intro}
      base={`/catalog/${slug}`}
      items={result.items}
      total={result.total}
      page={result.page}
      pages={result.pages}
      crumbs={[{ name: "Главная", href: "/" }, { name: "Каталог", href: "/catalog" }, { name: category.name }]}
      sort={filters.sort}
      availability={filters.availability}
      condition={filters.condition}
    >
      {category.children.length > 0 && (
        <ul className="mt-4 flex flex-wrap gap-2">
          {category.children.map((child) => (
            <li key={child.id}>
              <Link className="btn-ghost" href={`/catalog/${category.slug}/${child.slug}`}>{child.name}</Link>
            </li>
          ))}
        </ul>
      )}
    </CatalogView>
  );
}
