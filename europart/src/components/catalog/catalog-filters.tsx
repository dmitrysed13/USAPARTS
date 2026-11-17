import type { CatalogFilters } from "@/modules/catalog/filters";
import { controlClassName } from "@/components/ui/field";
import { buttonClassName } from "@/components/ui/button";

const availabilityOptions = [
  ["", "Любое"],
  ["IN_STOCK", "В наличии"],
  ["LOW_STOCK", "Мало на складе"],
  ["ON_ORDER", "Под заказ"],
  ["INCOMING", "Ожидается поставка"],
  ["OUT_OF_STOCK", "Нет в наличии"],
  ["UNKNOWN", "Наличие не подтверждено"],
  ["DISCONTINUED", "Снят с продажи"],
] as const;

export function CatalogFilters({
  action,
  filters,
  partBrands,
  categories = [],
  showVehicleFilters = false,
}: {
  action: string;
  filters: CatalogFilters;
  partBrands: { name: string; slug: string }[];
  categories?: { name: string; slug: string }[];
  showVehicleFilters?: boolean;
}) {
  return (
    <form
      action={action}
      className="grid gap-4 rounded-2xl border border-line p-4"
      method="get"
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {categories.length > 0 ? (
          <label className="grid gap-2 text-sm font-medium">
            Категория
            <select
              className={controlClassName}
              defaultValue={filters.category ?? ""}
              name="category"
            >
              <option value="">Все</option>
              {categories.map((category) => (
                <option key={category.slug} value={category.slug}>
                  {category.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-medium">
          Состояние
          <select
            className={controlClassName}
            defaultValue={filters.condition ?? ""}
            name="condition"
          >
            <option value="">Любое</option>
            <option value="NEW">Новая</option>
            <option value="USED">Б/у</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Тип
          <select
            className={controlClassName}
            defaultValue={filters.productType ?? ""}
            name="productType"
          >
            <option value="">Любой</option>
            <option value="ORIGINAL">Оригинал</option>
            <option value="ANALOG">Аналог</option>
          </select>
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Наличие
          <select
            className={controlClassName}
            defaultValue={filters.availability ?? ""}
            name="availability"
          >
            {availabilityOptions.map(([value, label]) => (
              <option key={value || "any"} value={value}>
                {label}
              </option>
            ))}
          </select>
        </label>
        {partBrands.length > 0 ? (
          <label className="grid gap-2 text-sm font-medium">
            Бренд запчасти
            <select
              className={controlClassName}
              defaultValue={filters.partBrand ?? ""}
              name="partBrand"
            >
              <option value="">Все</option>
              {partBrands.map((brand) => (
                <option key={brand.slug} value={brand.slug}>
                  {brand.name}
                </option>
              ))}
            </select>
          </label>
        ) : null}
        <label className="grid gap-2 text-sm font-medium">
          Цена от, BYN
          <input
            className={controlClassName}
            defaultValue={filters.priceMin ?? ""}
            inputMode="decimal"
            min="0"
            name="priceMin"
            step="0.01"
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Цена до, BYN
          <input
            className={controlClassName}
            defaultValue={filters.priceMax ?? ""}
            inputMode="decimal"
            min="0"
            name="priceMax"
            step="0.01"
            type="number"
          />
        </label>
        <label className="grid gap-2 text-sm font-medium">
          Сортировка
          <select className={controlClassName} defaultValue={filters.sort} name="sort">
            <option value="name_asc">По названию, А–Я</option>
            <option value="name_desc">По названию, Я–А</option>
            <option value="newest">Сначала новые</option>
          </select>
        </label>
        {showVehicleFilters ? (
          <>
            <label className="grid gap-2 text-sm font-medium">
              Год от
              <input
                className={controlClassName}
                defaultValue={filters.yearFrom ?? ""}
                inputMode="numeric"
                max="2100"
                min="1950"
                name="yearFrom"
                step="1"
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Год до
              <input
                className={controlClassName}
                defaultValue={filters.yearTo ?? ""}
                inputMode="numeric"
                max="2100"
                min="1950"
                name="yearTo"
                step="1"
                type="number"
              />
            </label>
            <label className="grid gap-2 text-sm font-medium">
              Топливо
              <input
                className={controlClassName}
                defaultValue={filters.fuelType ?? ""}
                maxLength={40}
                name="fuelType"
                placeholder="бензин, дизель…"
                type="text"
              />
            </label>
          </>
        ) : null}
      </div>
      <div className="flex flex-wrap gap-3">
        <button className={buttonClassName("primary")} type="submit">
          Показать
        </button>
        <a className={buttonClassName("ghost")} href={action}>
          Сбросить
        </a>
      </div>
    </form>
  );
}
