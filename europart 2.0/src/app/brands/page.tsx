import { connection } from "next/server";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { Container } from "@/components/ui/container";
import { EmptyState } from "@/components/ui/state";
import { closedMetadata } from "@/lib/seo/closed";
import { listVehicleBrands } from "@/modules/fitment/repository";

export const metadata = closedMetadata({
  title: "Марки автомобилей",
  description:
    "Марки, для которых в EUROPART можно открыть модели и подтверждённый ассортимент.",
  canonical: "/brands",
});

export default async function BrandsPage() {
  await connection();
  const brands = await listVehicleBrands();

  return (
    <Container className="grid gap-8 py-10">
      <Breadcrumbs items={[{ href: "/", label: "Главная" }, { label: "Марки" }]} />
      <div>
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Марки автомобилей
        </h1>
        <p className="mt-3 max-w-2xl text-ink-muted">
          Список собран из справочника. Марка без моделей не получает выдуманный модельный
          ряд.
        </p>
      </div>
      {brands.length === 0 ? (
        <EmptyState
          description="Справочник марок ещё не загружен."
          title="Марок пока нет"
        />
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {brands.map((brand) => (
            <li key={brand.id}>
              <Link
                className="block h-full rounded-2xl border border-line p-5 hover:border-brand"
                href={`/brands/${brand.slug}`}
              >
                <span className="break-words font-display text-xl font-semibold">
                  {brand.name}
                </span>
                {brand.description ? (
                  <span className="mt-2 block text-sm leading-6 text-ink-muted">
                    {brand.description}
                  </span>
                ) : null}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </Container>
  );
}
