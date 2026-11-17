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
import { getVehicleModel } from "@/modules/fitment/repository";
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
        vehicleModification: {
          generation: { modelId: vehicle.id, isActive: true },
        },
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
        {span ? <p className="mt-3 text-ink-muted">{span}</p> : null}
      </div>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Поколения</h2>
        {vehicle.generations.length === 0 ? (
          <p className="text-ink-muted">Поколения для этой модели не загружены.</p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {vehicle.generations.map((generation) => {
              const generationSpan = years(generation.startYear, generation.endYear);
              return (
                <li key={generation.id}>
                  <Link
                    className="block rounded-2xl border border-line p-4 hover:border-brand"
                    href={`/brands/${vehicle.brand.slug}/${vehicle.slug}/${generation.slug}`}
                  >
                    <span className="break-words font-semibold">{generation.name}</span>
                    {generationSpan ? (
                      <span className="mt-1 block text-sm text-ink-muted">
                        {generationSpan}
                      </span>
                    ) : null}
                  </Link>
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
