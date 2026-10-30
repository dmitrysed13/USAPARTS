import { notFound } from "next/navigation";
import Link from "next/link";
import { CatalogView } from "@/components/catalog-view";
import { getCategoryTree, listProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { listingMetadata } from "@/lib/listing-meta";
import { toFilters } from "@/lib/query";
import { seoFromTemplate } from "@/lib/seo";

export const revalidate = 300;

async function load(make: string, model: string, year: string, searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const yearNumber = Number(year);
  if (!Number.isInteger(yearNumber)) notFound();
  const row = await prisma.vehicleYear.findFirst({
    where: { year: yearNumber, generation: { model: { slug: model, make: { slug: make } } } },
    include: { engines: true, generation: { include: { model: { include: { make: true } } } } },
  });
  if (!row) notFound();
  const filters = toFilters(await searchParams, { make, model, year: yearNumber });
  const result = await listProducts(filters);
  if ((filters.page ?? 1) > result.pages && result.total > 0) notFound();
  return { row, filters, result, yearNumber };
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ make: string; model: string; year: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { make, model, year } = await params;
  const loaded = await load(make, model, year, searchParams);
  const vehicle = loaded.row.generation.model;
  const seo = await seoFromTemplate("year", { make: vehicle.make.name, model: vehicle.name, year: loaded.yearNumber, name: `${vehicle.make.name} ${vehicle.name} ${loaded.yearNumber}` });
  return listingMetadata({ title: seo.title, description: seo.description, path: `/brands/${make}/${model}/${year}`, filters: loaded.filters, total: loaded.result.total });
}

export default async function YearPage({ params, searchParams }: { params: Promise<{ make: string; model: string; year: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { make, model, year } = await params;
  const { row, filters, result, yearNumber } = await load(make, model, year, searchParams);
  const vehicle = row.generation.model;
  const categories = await getCategoryTree();
  return (
    <CatalogView
      title={`Запчасти ${vehicle.make.name} ${vehicle.name} ${yearNumber}`}
      intro={`${row.generation.name}. Двигатели в справочнике: ${row.engines.map((engine) => engine.name).join(", ") || "не заданы"}.`}
      base={`/brands/${make}/${model}/${year}`}
      items={result.items}
      total={result.total}
      page={result.page}
      pages={result.pages}
      crumbs={[
        { name: "Главная", href: "/" },
        { name: vehicle.make.name, href: `/brands/${make}` },
        { name: vehicle.name, href: `/brands/${make}/${model}` },
        { name: String(yearNumber) },
      ]}
      sort={filters.sort}
      availability={filters.availability}
      condition={filters.condition}
    >
      <ul className="mt-4 flex flex-wrap gap-2">
        {categories.map((category) => (
          <li key={category.id}>
            <Link className="btn-ghost" href={`/brands/${make}/${model}/${year}/${category.slug}`}>{category.name}</Link>
          </li>
        ))}
      </ul>
    </CatalogView>
  );
}
