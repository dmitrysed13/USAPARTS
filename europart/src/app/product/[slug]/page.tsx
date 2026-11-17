import { connection } from "next/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { formatLeadTime } from "@/modules/commerce/availability";
import {
  conditionLabels,
  identifierTypeLabels,
  productTypeLabels,
} from "@/modules/catalog/labels";
import { publicAvailabilityLabels } from "@/modules/catalog/public-dto";
import { getPublishedProduct } from "@/modules/catalog/repository";
import { readSeoOverlay } from "@/modules/seo/overlay";
import { closedMetadata } from "@/lib/seo/closed";

function money(amount: string, currency: string): string {
  return `${new Intl.NumberFormat("ru-BY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount))} ${currency}`;
}

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  await connection();
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) {
    return closedMetadata({ title: "Товар", canonical: "/catalog" });
  }
  const seo = await readSeoOverlay("PRODUCT", product.id, {
    title: product.name,
    description: product.description,
    canonicalPath: `/product/${product.slug}`,
  });
  return closedMetadata({
    title: seo.title,
    description: seo.description,
    canonical: seo.canonicalPath,
  });
}

export default async function ProductPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const product = await getPublishedProduct(slug);
  if (!product) {
    notFound();
  }
  const seo = await readSeoOverlay("PRODUCT", product.id, {
    title: product.name,
    description: product.description,
    canonicalPath: `/product/${product.slug}`,
  });
  const requestParams = new URLSearchParams({ partName: product.name });
  if (product.article) {
    requestParams.set("partNumber", product.article);
  } else if (product.oem) {
    requestParams.set("partNumber", product.oem);
  }
  const facts = [
    product.article ? { label: "Артикул", value: product.article, mono: true } : null,
    product.oem ? { label: "OEM", value: product.oem, mono: true } : null,
    product.partBrand
      ? {
          label: "Бренд запчасти",
          value: product.partBrand.country
            ? `${product.partBrand.name}, ${product.partBrand.country}`
            : product.partBrand.name,
          mono: false,
        }
      : null,
    { label: "Состояние", value: conditionLabels[product.condition], mono: false },
    { label: "Тип", value: productTypeLabels[product.productType], mono: false },
    product.weightKg ? { label: "Вес, кг", value: product.weightKg, mono: false } : null,
  ].filter(
    (fact): fact is { label: string; value: string; mono: boolean } => fact !== null,
  );
  const grouped = (["OEM", "ARTICLE", "CROSS_REFERENCE"] as const)
    .map((type) => ({
      type,
      values: product.identifiers.filter((item) => item.type === type),
    }))
    .filter((group) => group.values.length > 0);

  return (
    <Container className="grid gap-8 py-10">
      <Breadcrumbs
        items={[
          { href: "/", label: "Главная" },
          { href: "/catalog", label: "Каталог" },
          { href: `/catalog/${product.category.slug}`, label: product.category.name },
          { label: product.name },
        ]}
      />
      <div className="grid gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
        <div>
          {product.images.length > 0 ? (
            <ul className="grid gap-3">
              {product.images.map((image) => (
                <li key={image.url}>
                  {/* Remote catalog photos are not configured for the image optimizer yet. */}
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    alt={image.alt}
                    className="w-full rounded-2xl bg-surface-muted object-contain"
                    src={image.url}
                  />
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center rounded-2xl bg-surface-muted px-6 text-center text-ink-muted">
              Фото не загружено
            </div>
          )}
        </div>
        <div className="grid content-start gap-6">
          <h1 className="break-words font-display text-4xl font-semibold tracking-tight">
            {seo.h1}
          </h1>
          <dl className="grid gap-3">
            {facts.map((fact) => (
              <div className="grid grid-cols-[9rem_minmax(0,1fr)] gap-3" key={fact.label}>
                <dt className="text-sm text-ink-muted">{fact.label}</dt>
                <dd
                  className={
                    fact.mono ? "break-all font-medium" : "break-words font-medium"
                  }
                >
                  {fact.value}
                </dd>
              </div>
            ))}
          </dl>
          <div>
            <p className="text-sm text-ink-muted">Наличие</p>
            <p className="mt-1 font-semibold">
              {publicAvailabilityLabels[product.availability]}
            </p>
            {product.leadTimeDays !== null ? (
              <p className="mt-1 text-sm text-ink-muted">
                {formatLeadTime(product.leadTimeDays)}
              </p>
            ) : null}
          </div>
          <div>
            {product.price ? (
              <p className="font-display text-3xl font-semibold">
                {money(product.price.amount, product.price.currency)}
              </p>
            ) : (
              <Link
                className={buttonClassName("secondary")}
                href={`/vin-search?${requestParams.toString()}`}
              >
                Уточнить цену
              </Link>
            )}
          </div>
          <Link
            className={buttonClassName("primary")}
            href={`/vin-search?${requestParams.toString()}`}
          >
            Отправить запрос менеджеру
          </Link>
        </div>
      </div>
      {product.description ? (
        <section>
          <h2 className="font-display text-2xl font-semibold">Описание</h2>
          <p className="mt-3 max-w-3xl whitespace-pre-wrap leading-7">
            {product.description}
          </p>
        </section>
      ) : null}
      {grouped.length > 0 ? (
        <section>
          <h2 className="font-display text-2xl font-semibold">Номера</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            {grouped.map((group) => (
              <div key={group.type}>
                <h3 className="text-sm font-semibold text-ink-muted">
                  {identifierTypeLabels[group.type]}
                </h3>
                <ul className="mt-2 space-y-1">
                  {group.values.map((item) => (
                    <li className="break-all" key={`${group.type}-${item.value}`}>
                      {item.value}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </section>
      ) : null}
      {product.compatibility.length > 0 ? (
        <section>
          <h2 className="font-display text-2xl font-semibold">
            Подтверждённая совместимость
          </h2>
          <ul className="mt-4 grid gap-3 sm:grid-cols-2">
            {product.compatibility.map((item) => (
              <li
                className="rounded-2xl border border-line p-4"
                key={`${item.brandSlug}-${item.modelSlug}-${item.modificationName}`}
              >
                <Link
                  className="font-semibold hover:text-brand"
                  href={`/brands/${item.brandSlug}`}
                >
                  {item.brandName}
                </Link>
                {" · "}
                <Link
                  className="hover:text-brand"
                  href={`/brands/${item.brandSlug}/${item.modelSlug}`}
                >
                  {item.modelName}
                </Link>
                <p className="mt-1 break-words text-sm text-ink-muted">
                  {item.modificationName}
                  {item.yearFrom || item.yearTo
                    ? ` · ${item.yearFrom ?? "…"}–${item.yearTo ?? "…"}`
                    : ""}
                </p>
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </Container>
  );
}
