import { connection } from "next/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/state";
import { closedMetadata } from "@/lib/seo/closed";
import { listCategoriesForFitment } from "@/modules/catalog/repository";
import { getVehicleBrand } from "@/modules/fitment/repository";
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
  params: Promise<{ brand: string }>;
}): Promise<Metadata> {
  await connection();
  const { brand: slug } = await params;
  const brand = await getVehicleBrand(slug);
  if (!brand) {
    return closedMetadata({ title: "Марка", canonical: "/brands" });
  }
  const seo = await readSeoOverlay("VEHICLE_BRAND", brand.id, {
    title: brand.name,
    description: brand.description,
    canonicalPath: `/brands/${brand.slug}`,
  });
  return closedMetadata({
    title: seo.title,
    description: seo.description,
    canonical: seo.canonicalPath,
  });
}

export default async function BrandPage({
  params,
}: {
  params: Promise<{ brand: string }>;
}) {
  await connection();
  const { brand: slug } = await params;
  const brand = await getVehicleBrand(slug);
  if (!brand) {
    notFound();
  }
  const [categories, seo] = await Promise.all([
    listCategoriesForFitment({ brandId: brand.id }),
    readSeoOverlay("VEHICLE_BRAND", brand.id, {
      title: brand.name,
      description: brand.description,
      canonicalPath: `/brands/${brand.slug}`,
    }),
  ]);

  return (
    <Container className="grid gap-10 py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { href: "/brands", label: "Марки" },
          { label: brand.name },
        ]}
      />
      <div>
        <h1 className="break-words font-display text-4xl font-semibold tracking-tight">
          {seo.h1}
        </h1>
        {brand.description ? (
          <p className="mt-3 max-w-3xl leading-7 text-ink-muted">{brand.description}</p>
        ) : null}
      </div>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Модели</h2>
        {brand.models.length === 0 ? (
          <EmptyState
            description="Для этой марки модели ещё не загружены."
            title="Моделей нет"
          />
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2">
            {brand.models.map((model) => {
              const span = years(model.startYear, model.endYear);
              return (
                <li key={model.id}>
                  <Link
                    className="block rounded-2xl border border-line p-4 hover:border-brand"
                    href={`/brands/${brand.slug}/${model.slug}`}
                  >
                    <span className="break-words font-semibold">{model.name}</span>
                    {model.generation ? (
                      <span className="mt-1 block text-sm text-ink-muted">
                        {model.generation}
                      </span>
                    ) : null}
                    {span ? (
                      <span className="mt-1 block text-sm text-ink-muted">{span}</span>
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        )}
      </section>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">
          Категории с подтверждённым ассортиментом
        </h2>
        {categories.length === 0 ? (
          <EmptyState
            description="Категория попадает сюда только если есть опубликованный товар с подтверждённой совместимостью."
            title="Подходящих категорий нет"
          />
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
    </Container>
  );
}
