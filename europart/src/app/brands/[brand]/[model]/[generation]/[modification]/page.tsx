import { connection } from "next/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import { SelectVehicleButton } from "@/components/catalog/select-vehicle-button";
import { Container } from "@/components/ui/container";
import { closedMetadata } from "@/lib/seo/closed";
import { catalogHref, parseCatalogFilters } from "@/modules/catalog/filters";
import {
  fitmentProductWhere,
  listCategoriesForFitment,
  listPartBrandsForProducts,
  listPublishedProducts,
} from "@/modules/catalog/repository";
import { getVehicleModification } from "@/modules/fitment/repository";
import { readSeoOverlay } from "@/modules/seo/overlay";

export async function generateMetadata({
  params,
}: {
  params: Promise<{
    brand: string;
    model: string;
    generation: string;
    modification: string;
  }>;
}): Promise<Metadata> {
  await connection();
  const { brand, model, generation, modification } = await params;
  const vehicle = await getVehicleModification(brand, model, generation, modification);
  if (!vehicle) {
    return closedMetadata({ title: "Модификация", canonical: "/brands" });
  }
  const path = `/brands/${vehicle.brand.slug}/${vehicle.model.slug}/${vehicle.generation.slug}/${vehicle.slug}`;
  const seo = await readSeoOverlay("VEHICLE_MODIFICATION", vehicle.id, {
    title: `${vehicle.brand.name} ${vehicle.model.name} ${vehicle.name}`,
    description: null,
    canonicalPath: path,
  });
  return closedMetadata({
    title: seo.title,
    description: seo.description,
    canonical: seo.canonicalPath,
  });
}

export default async function ModificationPage({
  params,
  searchParams,
}: {
  params: Promise<{
    brand: string;
    model: string;
    generation: string;
    modification: string;
  }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { brand, model, generation, modification } = await params;
  const vehicle = await getVehicleModification(brand, model, generation, modification);
  if (!vehicle) {
    notFound();
  }

  const filters = parseCatalogFilters(await searchParams);
  const fitment = {
    modificationId: vehicle.id,
    yearFrom: filters.yearFrom,
    yearTo: filters.yearTo,
    fuelType: filters.fuelType,
  };
  const scope = fitmentProductWhere(fitment);
  const path = `/brands/${vehicle.brand.slug}/${vehicle.model.slug}/${vehicle.generation.slug}/${vehicle.slug}`;
  const [categories, page, partBrands, seo] = await Promise.all([
    listCategoriesForFitment({ modificationId: vehicle.id }),
    listPublishedProducts(filters, scope),
    listPartBrandsForProducts(scope),
    readSeoOverlay("VEHICLE_MODIFICATION", vehicle.id, {
      title: `${vehicle.brand.name} ${vehicle.model.name} ${vehicle.name}`,
      description: null,
      canonicalPath: path,
    }),
  ]);

  if (filters.category && page.total === 0) {
    notFound();
  }

  return (
    <Container className="grid gap-10 py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { href: "/brands", label: "Марки" },
          { href: `/brands/${vehicle.brand.slug}`, label: vehicle.brand.name },
          {
            href: `/brands/${vehicle.brand.slug}/${vehicle.model.slug}`,
            label: vehicle.model.name,
          },
          {
            href: `/brands/${vehicle.brand.slug}/${vehicle.model.slug}/${vehicle.generation.slug}`,
            label: vehicle.generation.name,
          },
          { label: vehicle.name },
        ]}
      />
      <div className="grid gap-4">
        <h1 className="break-words font-display text-4xl font-semibold tracking-tight">
          {seo.h1}
        </h1>
        <SelectVehicleButton
          vehicle={{
            brandSlug: vehicle.brand.slug,
            brandName: vehicle.brand.name,
            modelSlug: vehicle.model.slug,
            modelName: vehicle.model.name,
            generationSlug: vehicle.generation.slug,
            generationName: vehicle.generation.name,
            modificationSlug: vehicle.slug,
            modificationName: vehicle.name,
          }}
        />
      </div>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Двигатели</h2>
        {vehicle.engines.length === 0 ? (
          <p className="text-ink-muted">
            Двигатели для этой модификации ещё не загружены. Их можно добавить через админ API.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {vehicle.engines.map((engine) => (
              <li key={engine.id}>
                <Link
                  className="block rounded-2xl border border-line p-4 hover:border-brand"
                  href={`${path}/${engine.slug}`}
                >
                  <span className="break-words font-semibold">{engine.name}</span>
                  {engine.code ? (
                    <span className="mt-1 block text-sm text-ink-muted">{engine.code}</span>
                  ) : null}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Категории</h2>
        {categories.length === 0 ? (
          <p className="text-ink-muted">Нет категорий с подтверждённой совместимостью.</p>
        ) : (
          <ul className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <li key={category.slug}>
                <Link
                  className="inline-flex rounded-full border border-line px-3 py-2 text-sm font-semibold hover:border-brand"
                  href={catalogHref(path, { ...filters, category: category.slug, page: 1 }, 1)}
                >
                  {category.name}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Подходящие товары</h2>
        <CatalogFilters
          action={path}
          categories={categories}
          filters={filters}
          partBrands={partBrands}
          showVehicleFilters
        />
        <ProductGrid
          emptyDescription="Для этой модификации нет опубликованных товаров с подтверждённой совместимостью."
          emptyTitle="Подходящих товаров нет"
          items={page.items}
        />
        <Pagination
          hrefFor={(nextPage) => catalogHref(path, filters, nextPage)}
          page={page.page}
          pageSize={page.pageSize}
          total={page.total}
        />
      </section>
    </Container>
  );
}
