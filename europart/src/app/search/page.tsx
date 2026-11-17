import { connection } from "next/server";
import { Suspense } from "react";
import { TrackOnMount } from "@/components/analytics/track-on-mount";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import { SearchField } from "@/components/catalog/search-field";
import { VehiclePicker } from "@/components/catalog/vehicle-picker";
import { Container } from "@/components/ui/container";
import { closedMetadata } from "@/lib/seo/closed";
import { parseSearchQuery } from "@/modules/catalog/search-params";
import { searchPublishedProducts } from "@/modules/catalog/repository";
import { readSelectedVehicle } from "@/modules/fitment/vehicle-http";

export const metadata = closedMetadata({
  title: "Поиск",
  description:
    "Поиск по OEM, MPN, артикулу, кроссу и аналогам. Пробелы и дефисы не мешают точному номеру.",
  canonical: "/search",
});

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
}

async function SearchVehiclePicker() {
  const selected = await readSelectedVehicle();
  return (
    <VehiclePicker
      initial={
        selected
          ? {
              brandSlug: selected.brandSlug,
              modelSlug: selected.modelSlug,
              generationSlug: selected.generationSlug,
              modificationSlug: selected.modificationSlug,
              engineSlug: selected.engineSlug,
            }
          : undefined
      }
    />
  );
}

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const query = await searchParams;
  const raw = one(query.q)?.trim() ?? "";
  const parsed = parseSearchQuery({ q: raw, page: one(query.page) ?? null });

  return (
    <Container className="grid gap-8 py-10">
      <Breadcrumbs items={[{ href: "/", label: "Главная" }, { label: "Поиск" }]} />
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">Поиск</h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Ищем по OEM, MPN, артикулу производителя, кросс-номерам и аналогам. Регистр,
          пробелы и дефисы не мешают. Цена, наличие, источник предложения и совместимость
          показываются только когда есть в базе.
        </p>
      </div>
      <SearchField initialQuery={raw} />
      <Suspense fallback={null}>
        <SearchVehiclePicker />
      </Suspense>
      {!raw ? <p className="text-ink-muted">Введите артикул, OEM, MPN или название.</p> : null}
      {raw && !parsed.ok ? <p role="alert">{parsed.message}</p> : null}
      {parsed.ok ? (
        <Suspense fallback={<p className="text-ink-muted">Ищем…</p>}>
          <SearchResults page={parsed.query.page} q={parsed.query.q} />
        </Suspense>
      ) : null}
    </Container>
  );
}

async function SearchResults({ q, page }: { q: string; page: number }) {
  const result = await searchPublishedProducts({ q, page, pageSize: 12 });
  return (
    <>
      <TrackOnMount
        name="search"
        params={{
          // Article/OEM queries are not customer PII; still truncated.
          search_term: q.slice(0, 80),
          result_count: result.total,
          page: result.page,
        }}
      />
      <ProductGrid
        emptyDescription="Проверьте номер или оставьте заявку по VIN — автоматической подстановки выдуманных позиций нет."
        emptyTitle="Ничего не найдено"
        items={result.items}
      />
      <Pagination
        hrefFor={(nextPage) => {
          const params = new URLSearchParams({ q });
          if (nextPage > 1) {
            params.set("page", String(nextPage));
          }
          return `/search?${params.toString()}`;
        }}
        page={result.page}
        pageSize={result.pageSize}
        total={result.total}
      />
    </>
  );
}
