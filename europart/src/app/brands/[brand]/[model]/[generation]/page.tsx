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
import {
  getVehicleGeneration,
  type PublicModification,
} from "@/modules/fitment/repository";
import { readSeoOverlay } from "@/modules/seo/overlay";

function years(start: number | null, end: number | null): string | null {
  if (start && end) {
    return `${start}–${end}`;
  }
  if (start) {
    return `с ${start}`;
  }
  if (end) {
    return `до ${end}`;
  }
  return null;
}

function modificationFacts(item: PublicModification): { label: string; value: string }[] {
  const span = years(item.yearFrom, item.yearTo);
  return [
    span ? { label: "Годы", value: span } : null,
    item.engine ? { label: "Двигатель", value: item.engine } : null,
    item.engineCode ? { label: "Код двигателя", value: item.engineCode } : null,
    item.fuelType ? { label: "Топливо", value: item.fuelType } : null,
    item.displacement ? { label: "Объём, л", value: item.displacement } : null,
    item.power ? { label: "Мощность, л.с.", value: String(item.power) } : null,
    item.bodyType ? { label: "Кузов", value: item.bodyType } : null,
    item.transmission ? { label: "Коробка", value: item.transmission } : null,
    item.driveType ? { label: "Привод", value: item.driveType } : null,
  ].filter((fact): fact is { label: string; value: string } => fact !== null);
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ brand: string; model: string; generation: string }>;
}): Promise<Metadata> {
  await connection();
  const { brand, model, generation } = await params;
  const vehicle = await getVehicleGeneration(brand, model, generation);
  if (!vehicle) {
    return closedMetadata({ title: "Поколение", canonical: "/brands" });
  }
  const seo = await readSeoOverlay("VEHICLE_GENERATION", vehicle.id, {
    title: `${vehicle.brand.name} ${vehicle.model.name} ${vehicle.name}`,
    description: null,
    canonicalPath: `/brands/${vehicle.brand.slug}/${vehicle.model.slug}/${vehicle.slug}`,
  });
  return closedMetadata({
    title: seo.title,
    description: seo.description,
    canonical: seo.canonicalPath,
  });
}

export default async function GenerationPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string; model: string; generation: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { brand, model, generation } = await params;
  const vehicle = await getVehicleGeneration(brand, model, generation);
  if (!vehicle) {
    notFound();
  }
  const filters = parseCatalogFilters(await searchParams);
  const scope = fitmentProductWhere({
    generationId: vehicle.id,
    yearFrom: filters.yearFrom,
    yearTo: filters.yearTo,
    fuelType: filters.fuelType,
  });
  const path = `/brands/${vehicle.brand.slug}/${vehicle.model.slug}/${vehicle.slug}`;
  const [categories, page, partBrands, seo] = await Promise.all([
    listCategoriesForFitment({ generationId: vehicle.id }),
    listPublishedProducts(filters, scope),
    listPartBrandsForProducts(scope),
    readSeoOverlay("VEHICLE_GENERATION", vehicle.id, {
      title: `${vehicle.brand.name} ${vehicle.model.name} ${vehicle.name}`,
      description: null,
      canonicalPath: path,
    }),
  ]);

  if (filters.category && page.total === 0) {
    notFound();
  }

  const span = years(vehicle.startYear, vehicle.endYear);

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
          { label: vehicle.name },
        ]}
      />
      <div className="grid gap-4">
        <h1 className="break-words font-display text-4xl font-semibold tracking-tight">
          {seo.h1}
        </h1>
        {span ? <p className="text-ink-muted">{span}</p> : null}
        <SelectVehicleButton
          vehicle={{
            brandSlug: vehicle.brand.slug,
            brandName: vehicle.brand.name,
            modelSlug: vehicle.model.slug,
            modelName: vehicle.model.name,
            generationSlug: vehicle.slug,
            generationName: vehicle.name,
          }}
        />
      </div>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Модификации</h2>
        {vehicle.modifications.length === 0 ? (
          <p className="text-ink-muted">Модификации для этого поколения не загружены.</p>
        ) : (
          <ul className="grid gap-3">
            {vehicle.modifications.map((item) => {
              const facts = modificationFacts(item);
              return (
                <li className="rounded-2xl border border-line p-4" key={item.id}>
                  <Link
                    className="break-words font-semibold hover:text-brand"
                    href={`${path}/${item.slug}`}
                  >
                    {item.name}
                  </Link>
                  {facts.length > 0 ? (
                    <dl className="mt-3 grid gap-2 sm:grid-cols-2">
                      {facts.map((fact) => (
                        <div key={fact.label}>
                          <dt className="text-xs text-ink-muted">{fact.label}</dt>
                          <dd className="break-words">{fact.value}</dd>
                        </div>
                      ))}
                    </dl>
                  ) : null}
                </li>
              );
            })}
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
          emptyDescription="Для этого поколения нет опубликованных товаров с подтверждённой совместимостью."
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
