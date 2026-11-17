import { connection } from "next/server";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import { SearchField } from "@/components/catalog/search-field";
import { Container } from "@/components/ui/container";
import { closedMetadata } from "@/lib/seo/closed";
import { parseSearchQuery } from "@/modules/catalog/search-params";
import { searchPublishedProducts } from "@/modules/catalog/repository";

export const metadata = closedMetadata({
  title: "Поиск",
  description: "Поиск опубликованных товаров EUROPART по названию, артикулу и OEM.",
  canonical: "/search",
});

function one(value: string | string[] | undefined): string | undefined {
  return Array.isArray(value) ? value[0] : value;
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
          Ищем по названию, артикулу, OEM и кросс-номеру. Регистр, пробелы и дефисы не
          мешают точному номеру.
        </p>
      </div>
      <SearchField initialQuery={raw} />
      {!raw ? <p className="text-ink-muted">Введите артикул, OEM или название.</p> : null}
      {raw && !parsed.ok ? <p role="alert">{parsed.message}</p> : null}
      {parsed.ok ? <SearchResults page={parsed.query.page} q={parsed.query.q} /> : null}
    </Container>
  );
}

async function SearchResults({ q, page }: { q: string; page: number }) {
  const result = await searchPublishedProducts({ q, page, pageSize: 12 });
  return (
    <>
      <ProductGrid
        emptyDescription="Проверьте номер или напишите его в заявке по VIN."
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
