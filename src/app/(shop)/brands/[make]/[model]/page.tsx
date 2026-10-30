import { notFound } from "next/navigation";
import Link from "next/link";
import { CatalogView } from "@/components/catalog-view";
import { listProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { listingMetadata } from "@/lib/listing-meta";
import { toFilters } from "@/lib/query";
import { seoFromTemplate } from "@/lib/seo";

export const revalidate = 300;

async function load(make: string, model: string, searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const row = await prisma.vehicleModel.findFirst({
    where: { slug: model, isActive: true, make: { slug: make, isActive: true } },
    include: { make: true, generations: { include: { years: { orderBy: { year: "asc" } } } } },
  });
  if (!row) notFound();
  const filters = toFilters(await searchParams, { make, model });
  const result = await listProducts(filters);
  if ((filters.page ?? 1) > result.pages && result.total > 0) notFound();
  return { row, filters, result };
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ make: string; model: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { make, model } = await params;
  const { row, filters, result } = await load(make, model, searchParams);
  const seo = await seoFromTemplate("model", { make: row.make.name, model: row.name, name: `${row.make.name} ${row.name}`, count: result.total }, { title: row.seoTitle, description: row.seoDescription });
  return listingMetadata({ title: seo.title, description: seo.description, path: `/brands/${make}/${model}`, filters, total: result.total });
}

export default async function ModelPage({ params, searchParams }: { params: Promise<{ make: string; model: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { make, model } = await params;
  const { row, filters, result } = await load(make, model, searchParams);
  const years = [...new Set(row.generations.flatMap((generation) => generation.years.map((year) => year.year)))].sort();
  return (
    <CatalogView
      title={`Запчасти ${row.make.name} ${row.name}`}
      intro={row.intro}
      base={`/brands/${make}/${model}`}
      items={result.items}
      total={result.total}
      page={result.page}
      pages={result.pages}
      crumbs={[
        { name: "Главная", href: "/" },
        { name: "Марки", href: "/brands" },
        { name: row.make.name, href: `/brands/${make}` },
        { name: row.name },
      ]}
      sort={filters.sort}
      availability={filters.availability}
      condition={filters.condition}
    >
      <ul className="mt-4 flex flex-wrap gap-2">
        {years.map((year) => (
          <li key={year}>
            <Link className="btn-ghost" href={`/brands/${make}/${model}/${year}`}>{year}</Link>
          </li>
        ))}
      </ul>
    </CatalogView>
  );
}
