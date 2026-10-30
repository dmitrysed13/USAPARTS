import { notFound } from "next/navigation";
import { CatalogView } from "@/components/catalog-view";
import { listProducts } from "@/lib/catalog";
import { prisma } from "@/lib/db";
import { listingMetadata } from "@/lib/listing-meta";
import { toFilters } from "@/lib/query";
import { seoFromTemplate } from "@/lib/seo";

export const revalidate = 300;

async function load(make: string, model: string, year: string, category: string, searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const yearNumber = Number(year);
  if (!Number.isInteger(yearNumber)) notFound();
  const [vehicle, cat] = await Promise.all([
    prisma.vehicleYear.findFirst({
      where: { year: yearNumber, generation: { model: { slug: model, make: { slug: make } } } },
      include: { generation: { include: { model: { include: { make: true } } } } },
    }),
    prisma.category.findFirst({ where: { slug: category, parentId: null, isActive: true } }),
  ]);
  if (!vehicle || !cat) notFound();
  const filters = toFilters(await searchParams, { make, model, year: yearNumber, category });
  const result = await listProducts(filters);
  if (result.total === 0) notFound();
  if ((filters.page ?? 1) > result.pages) notFound();
  return { vehicle, cat, filters, result, yearNumber };
}

export async function generateMetadata({ params, searchParams }: { params: Promise<{ make: string; model: string; year: string; category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { make, model, year, category } = await params;
  const loaded = await load(make, model, year, category, searchParams);
  const names = loaded.vehicle.generation.model;
  const seo = await seoFromTemplate("fitment", {
    category: loaded.cat.name,
    make: names.make.name,
    model: names.name,
    year: loaded.yearNumber,
    name: `${loaded.cat.name} ${names.make.name} ${names.name} ${loaded.yearNumber}`,
    count: loaded.result.total,
  });
  return listingMetadata({
    title: seo.title,
    description: seo.description,
    path: `/brands/${make}/${model}/${year}/${category}`,
    filters: loaded.filters,
    total: loaded.result.total,
  });
}

export default async function FitmentPage({ params, searchParams }: { params: Promise<{ make: string; model: string; year: string; category: string }>; searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { make, model, year, category } = await params;
  const { vehicle, cat, filters, result, yearNumber } = await load(make, model, year, category, searchParams);
  const names = vehicle.generation.model;
  return (
    <CatalogView
      title={`${cat.name} для ${names.make.name} ${names.name} ${yearNumber}`}
      intro={`В базе ${result.total} поз. категории «${cat.name}» для этого автомобиля. Список ниже собран из карточек, а не из шаблонного текста.`}
      base={`/brands/${make}/${model}/${year}/${category}`}
      items={result.items}
      total={result.total}
      page={result.page}
      pages={result.pages}
      crumbs={[
        { name: "Главная", href: "/" },
        { name: names.make.name, href: `/brands/${make}` },
        { name: names.name, href: `/brands/${make}/${model}` },
        { name: String(yearNumber), href: `/brands/${make}/${model}/${year}` },
        { name: cat.name },
      ]}
      sort={filters.sort}
      availability={filters.availability}
      condition={filters.condition}
    />
  );
}
