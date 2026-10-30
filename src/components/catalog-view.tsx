import { Breadcrumbs } from "@/components/breadcrumbs";
import { ListingFilters } from "@/components/filters";
import { Pagination, pageHref } from "@/components/pagination";
import { ProductList } from "@/components/product-card";
import type { ProductCard } from "@/lib/dto";
import { plural } from "@/lib/labels";

export function CatalogView({
  title,
  intro,
  base,
  items,
  total,
  page,
  pages,
  crumbs,
  sort,
  availability,
  condition,
  extraParams,
  children,
}: {
  title: string;
  intro?: string | null;
  base: string;
  items: ProductCard[];
  total: number;
  page: number;
  pages: number;
  crumbs: { name: string; href?: string }[];
  sort?: string;
  availability?: string;
  condition?: string;
  extraParams?: Record<string, string | undefined>;
  children?: React.ReactNode;
}) {
  const extra = { sort, availability, condition, ...extraParams };
  return (
    <div className="page py-8">
      <Breadcrumbs items={crumbs} />
      <h1 className="text-3xl font-semibold text-navy">{title}</h1>
      {intro && <p className="mt-3 max-w-3xl leading-7">{intro}</p>}
      <p className="mt-2 text-sm text-slate-500">
        {total} {plural(total, "позиция", "позиции", "позиций")} в базе
      </p>
      {children}
      <div className="mt-6">
        <ListingFilters base={base} sort={sort} availability={availability} condition={condition} />
        {(sort || availability || condition) && (
          <p className="mb-3 text-xs text-slate-500">Страница с фильтром не индексируется. Канонический адрес — без параметров сортировки и отбора.</p>
        )}
        <ProductList products={items} />
        <Pagination page={page} pages={pages} base={base} extra={extra} />
        {page > 1 && <link rel="prev" href={pageHref(base, page - 1, extra)} />}
        {page < pages && <link rel="next" href={pageHref(base, page + 1, extra)} />}
      </div>
    </div>
  );
}
