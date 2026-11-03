import { connection } from "next/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { CatalogFilters } from "@/components/catalog/catalog-filters";
import { Pagination } from "@/components/catalog/pagination";
import { ProductGrid } from "@/components/catalog/product-card";
import { Container } from "@/components/ui/container";
import { closedMetadata } from "@/lib/seo/closed";
import { catalogHref, parseCatalogFilters } from "@/modules/catalog/filters";
import {
  listCategoriesForFitment,
  listPartBrandsForProducts,
  listPublishedProducts,
} from "@/modules/catalog/repository";
import { getVehicleModel, type PublicModification } from "@/modules/fitment/repository";
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
  params: Promise<{ brand: string; model: string }>;
}): Promise<Metadata> {
  await connection();
  const { brand, model } = await params;
  const vehicle = await getVehicleModel(brand, model);
  if (!vehicle) {
    return closedMetadata({ title: "Модель", canonical: "/brands" });
  }
  const seo = await readSeoOverlay("VEHICLE_MODEL", vehicle.id, {
    title: `${vehicle.brand.name} ${vehicle.name}`,
    description: null,
    canonicalPath: `/brands/${vehicle.brand.slug}/${vehicle.slug}`,
  });
  return closedMetadata({
    title: seo.title,
    description: seo.description,
    canonical: seo.canonicalPath,
  });
}

export default async function ModelPage({
  params,
  searchParams,
}: {
  params: Promise<{ brand: string; model: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const { brand, model } = await params;
  const vehicle = await getVehicleModel(brand, model);
  if (!vehicle) {
    notFound();
  }
  const filters = parseCatalogFilters(await searchParams);
  const scope = {
    compatibilities: {
      some: {
        confidence: "VERIFIED" as const,
        vehicleModification: { modelId: vehicle.id },
      },
    },
  };
  const path = `/brands/${vehicle.brand.slug}/${vehicle.slug}`;
  const [categories, page, partBrands, seo] = await Promise.all([
    listCategoriesForFitment({ modelId: vehicle.id }),
    listPublishedProducts(filters, scope),
    listPartBrandsForProducts(scope),
    readSeoOverlay("VEHICLE_MODEL", vehicle.id, {
      title: `${vehicle.brand.name} ${vehicle.name}`,
      description: null,
      canonicalPath: path,
    }),
  ]);
  const span = years(vehicle.startYear, vehicle.endYear);

  return (
    <Container className="grid gap-10 py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { href: "/brands", label: "Марки" },
          { href: `/brands/${vehicle.brand.slug}`, label: vehicle.brand.name },
          { label: vehicle.name },
        ]}
      />
      <div>
        <h1 className="break-words font-display text-4xl font-semibold tracking-tight">
          {seo.h1}
        </h1>
        {vehicle.generation || span ? (
          <p className="mt-3 text-ink-muted">
            {[vehicle.generation, span].filter(Boolean).join(" · ")}
          </p>
        ) : null}
      </div>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Модификации</h2>
        {vehicle.modifications.length === 0 ? (
          <p className="text-ink-muted">Модификации для этой модели не загружены.</p>
        ) : (
          <ul className="grid gap-3">
            {vehicle.modifications.map((item) => {
              const facts = modificationFacts(item);
              return (
                <li className="rounded-2xl border border-line p-4" key={item.id}>
                  <p className="break-words font-semibold">{item.name}</p>
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
                  href={`/catalog/${category.slug}`}
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
        <p className="text-sm text-ink-muted">
          В списке только товары с подтверждённой совместимостью. Совпадение названия
          модели само по себе товар сюда не добавляет.
        </p>
        <CatalogFilters action={path} filters={filters} partBrands={partBrands} />
        <ProductGrid
          emptyDescription="Для этой модели нет опубликованных товаров с подтверждённой совместимостью."
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
