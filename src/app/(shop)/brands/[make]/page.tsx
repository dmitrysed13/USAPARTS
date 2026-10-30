import { notFound } from "next/navigation";
import Link from "next/link";
import { CatalogView } from "@/components/catalog-view";
import { listProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { listingMetadata } from "@/lib/listing-meta";
import { toFilters } from "@/lib/query";
import { seoFromTemplate } from "@/lib/seo";

export const revalidate = 300;

async function load(make: string, searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const brand = await prisma.vehicleMake.findFirst({
    where: { slug: make, isActive: true },
    include: { models: { where: { isActive: true }, orderBy: { name: "asc" } } },
  });
  if (!brand) notFound();
  const filters = toFilters(await searchParams, { make });
  const result = await listProducts(filters);
  if ((filters.page ?? 1) > result.pages && result.total > 0) notFound();
  return { brand, filters, result };
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ make: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { make } = await params;
  const { brand, filters, result } = await load(make, searchParams);
  const seo = await seoFromTemplate("brand", { name: brand.name, count: result.total }, { title: brand.seoTitle, description: brand.seoDescription });
  return listingMetadata({ title: seo.title, description: seo.description, path: `/brands/${make}`, filters, total: result.total });
}

export default async function MakePage({ params, searchParams }: { params: Promise<{ make: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { make } = await params;
  const { brand, filters, result } = await load(make, searchParams);
  return (
    <CatalogView
      title={`Запчасти ${brand.name}`}
      intro={brand.intro}
      base={`/brands/${make}`}
      items={result.items}
      total={result.total}
      page={result.page}
      pages={result.pages}
      crumbs={[{ name: "Главная", href: "/" }, { name: "Марки", href: "/brands" }, { name: brand.name }]}
      sort={filters.sort}
      availability={filters.availability}
      condition={filters.condition}
    >
      <ul className="mt-4 flex flex-wrap gap-2">
        {brand.models.map((model) => (
          <li key={model.id}>
            <Link className="btn-ghost" href={`/brands/${brand.slug}/${model.slug}`}>{model.name}</Link>
          </li>
        ))}
      </ul>
    </CatalogView>
  );
}
