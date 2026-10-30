import { CatalogView } from "@/components/catalog-view";
import { listProducts } from "@/lib/catalog";
import { listingMetadata } from "@/lib/listing-meta";
import { toFilters } from "@/lib/query";
import { notFound } from "next/navigation";

export const revalidate = 300;

async function load(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;
  const filters = toFilters(params);
  const result = await listProducts(filters);
  if (filters.page && filters.page > result.pages && result.total > 0) notFound();
  return { filters, result };
}

export async function generateMetadata({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { filters, result } = await load(searchParams);
  return listingMetadata({
    title: "Каталог автозапчастей",
    description: "Каталог новых и контрактных автозапчастей из США по категориям, маркам и OEM.",
    path: "/catalog",
    filters,
    total: result.total,
  });
}

export default async function CatalogPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const { filters, result } = await load(searchParams);
  return (
    <CatalogView
      title="Каталог автозапчастей"
      intro="Категории ведут на страницы с реальными карточками. Комбинации без товаров в индекс не попадают."
      base="/catalog"
      items={result.items}
      total={result.total}
      page={result.page}
      pages={result.pages}
      crumbs={[{ name: "Главная", href: "/" }, { name: "Каталог" }]}
      sort={filters.sort}
      availability={filters.availability}
      condition={filters.condition}
    />
  );
}
