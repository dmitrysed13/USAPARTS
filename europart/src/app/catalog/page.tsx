import { connection } from "next/server";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { SearchField } from "@/components/catalog/search-field";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/state";
import { closedMetadata } from "@/lib/seo/closed";
import {
  listActiveCategories,
  listCategoriesWithProducts,
} from "@/modules/catalog/repository";
import { listVehicleBrands } from "@/modules/fitment/repository";

export const metadata = closedMetadata({
  title: "Каталог",
  description:
    "Категории и марки EUROPART. Товары появляются после загрузки реального ассортимента.",
  canonical: "/catalog",
});

export default async function CatalogPage() {
  await connection();
  const [taxonomy, brands, withProducts] = await Promise.all([
    listActiveCategories(),
    listVehicleBrands(),
    listCategoriesWithProducts(),
  ]);
  const roots = taxonomy.filter((row) => !row.parentId);

  return (
    <Container className="grid gap-12 py-10">
      <div className="grid gap-6">
        <Breadcrumbs items={[{ href: "/", label: "Главная" }, { label: "Каталог" }]} />
        <div>
          <h1 className="font-display text-4xl font-semibold tracking-tight">Каталог</h1>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Публичные страницы категорий открываются только при наличии опубликованных
            товаров. Пустой список означает, что ассортимент ещё не загружен.
          </p>
        </div>
        <SearchField />
      </div>

      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Категории с товарами</h2>
        {withProducts.length === 0 ? (
          <EmptyState
            description="Ссылка на категорию появляется только после публикации реального товара."
            title="Товаров в каталоге нет"
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {withProducts.map((category) => (
              <li key={category.id}>
                <Link
                  className="block h-full rounded-2xl border border-line p-4 hover:border-brand"
                  href={`/catalog/${category.slug}`}
                >
                  <span className="break-words font-semibold">{category.name}</span>
                  {category.description ? (
                    <span className="mt-2 block text-sm leading-6 text-ink-muted">
                      {category.description}
                    </span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Справочник категорий</h2>
        <p className="text-sm text-ink-muted">
          Структурный список без ссылок на пустые разделы. Наполнение — через админ API.
        </p>
        {roots.length === 0 ? (
          <EmptyState
            description="Корневые категории появятся после миграции справочника или ручного добавления."
            title="Справочник пуст"
          />
        ) : (
          <ul className="flex flex-wrap gap-2">
            {roots.map((category) => (
              <li
                className="inline-flex rounded-full border border-dashed border-line px-3 py-2 text-sm text-ink-muted"
                key={category.id}
              >
                {category.name}
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <h2 className="font-display text-2xl font-semibold">Марки автомобилей</h2>
          <Link className="text-sm font-semibold text-brand" href="/brands">
            Все марки
          </Link>
        </div>
        {brands.length === 0 ? (
          <EmptyState
            description="Марки появятся после загрузки справочника автомобилей."
            title="Марок пока нет"
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {brands.map((brand) => (
              <li key={brand.id}>
                <Link
                  className="block rounded-2xl border border-line p-4 font-semibold hover:border-brand"
                  href={`/brands/${brand.slug}`}
                >
                  {brand.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
    </Container>
  );
}
