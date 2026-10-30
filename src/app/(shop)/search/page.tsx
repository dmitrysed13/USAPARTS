import type { Metadata } from "next";
import { CatalogView } from "@/components/catalog-view";
import { listProducts } from "@/lib/catalog";
import { toFilters } from "@/lib/query";
import { notFound } from "next/navigation";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Поиск запчастей",
  robots: { index: false, follow: true },
};

export default async function SearchPage({ searchParams }: { searchParams: Promise<Record<string, string | string[] | undefined>> }) {
  const params = await searchParams;
  const filters = toFilters(params);
  const result = await listProducts(filters);
  if ((filters.page ?? 1) > result.pages && result.total > 0) notFound();
  const title = filters.q ? `Поиск: ${filters.q}` : "Поиск по автомобилю";
  return (
    <CatalogView
      title={title}
      intro="Результаты не индексируются. Совпадения ищутся по названию, артикулу, OEM и тексту карточки, с учётом похожих написаний."
      base="/search"
      items={result.items}
      total={result.total}
      page={result.page}
      pages={result.pages}
      crumbs={[{ name: "Главная", href: "/" }, { name: "Поиск" }]}
      sort={filters.sort}
      availability={filters.availability}
      condition={filters.condition}
      extraParams={{
        q: filters.q,
        make: filters.make,
        model: filters.model,
        year: filters.year ? String(filters.year) : undefined,
        engine: filters.engine,
        category: filters.category,
      }}
    />
  );
}
