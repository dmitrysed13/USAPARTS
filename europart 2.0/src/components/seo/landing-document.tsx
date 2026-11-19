import Link from "next/link";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { ProductGrid } from "@/components/catalog/product-card";
import { SearchField } from "@/components/catalog/search-field";
import { JsonLd } from "@/components/seo/json-ld";
import { VinRequestForm } from "@/components/vin/vin-request-form";
import { Container } from "@/components/ui/container";
import { company, formatAddress } from "@/config/company";
import { getSiteUrl } from "@/lib/env";
import type { PublicCategory } from "@/modules/catalog/repository";
import type { PublicProduct } from "@/modules/catalog/public-dto";
import type { LandingLink, ResolvedLanding } from "@/modules/seo/landings";
import {
  breadcrumbStructuredData,
  faqStructuredData,
  storeStructuredData,
} from "@/modules/seo/structured-data";

export function LandingDocument({
  landing,
  products,
  categories,
  links,
}: {
  landing: ResolvedLanding;
  products: PublicProduct[];
  categories: PublicCategory[];
  links: LandingLink[];
}) {
  const siteUrl = getSiteUrl();
  const breadcrumbItems =
    landing.slug === "avtozapchasti"
      ? [{ href: "/", label: "Главная" }, { label: landing.h1 }]
      : [
          { href: "/", label: "Главная" },
          { href: "/avtozapchasti", label: "Автозапчасти" },
          { label: landing.h1 },
        ];

  return (
    <Container className="grid gap-12 py-10">
      <JsonLd data={breadcrumbStructuredData(breadcrumbItems, siteUrl)} />
      <JsonLd data={faqStructuredData(landing.faq)} />
      {landing.slug === "magazin-avtozapchastey" ? (
        <JsonLd data={storeStructuredData(siteUrl)} />
      ) : null}
      <div className="grid gap-6">
        <Breadcrumbs items={breadcrumbItems} />
        <div className="max-w-3xl">
          <h1 className="font-display text-4xl font-semibold tracking-tight">
            {landing.h1}
          </h1>
          <p className="mt-3 leading-7 text-ink-muted">{landing.intro}</p>
        </div>
        <SearchField />
      </div>

      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Опубликованные позиции</h2>
        <ProductGrid
          emptyDescription={landing.emptyDescription}
          emptyTitle={landing.emptyTitle}
          items={products}
        />
      </section>

      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Категории с товарами</h2>
        {categories.length === 0 ? (
          <p className="max-w-2xl text-sm leading-6 text-ink-muted">
            Ссылок на пустые категории нет. Рабочий каталог открывается отдельно, когда
            разделы уже заведены.
          </p>
        ) : (
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {categories.map((category) => (
              <li key={category.id}>
                <Link
                  className="block h-full rounded-2xl border border-line p-4 hover:border-brand"
                  href={`/catalog/${category.slug}`}
                >
                  <span className="break-words font-semibold">{category.name}</span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">
          Почему заявка идёт в EUROPART
        </h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {landing.advantages.map((item) => (
            <li
              className="rounded-2xl border border-line bg-surface-muted p-4 text-sm leading-6"
              key={item}
            >
              {item}
            </li>
          ))}
        </ul>
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-2xl font-semibold">Заказ и получение</h2>
        <p className="max-w-3xl leading-7 text-ink-muted">{landing.orderNote}</p>
        <p className="max-w-3xl text-sm leading-6 text-ink-muted">
          {company.legalName}, {formatAddress()}. Телефон{" "}
          <a className="font-semibold text-brand" href={`tel:${company.phoneTel}`}>
            {company.phoneDisplay}
          </a>
          , {company.phoneNote.toLowerCase()}. Почта{" "}
          <a
            className="underline decoration-line underline-offset-4"
            href={`mailto:${company.email}`}
          >
            {company.email}
          </a>
          . Корзина, онлайн-оплата и срок доставки по городам на этой платформе не
          подключены.
        </p>
      </section>

      <section className="grid max-w-3xl gap-4">
        <h2 className="font-display text-2xl font-semibold">
          Подбор по VIN или артикулу
        </h2>
        <p className="text-sm leading-6 text-ink-muted">
          Форма сохраняет заявку со статусом «новая». VIN не расшифровывается
          автоматически.
        </p>
        <VinRequestForm />
      </section>

      <section className="grid max-w-3xl gap-4">
        <h2 className="font-display text-2xl font-semibold">Что важно знать</h2>
        {landing.body.map((paragraph) => (
          <p className="leading-7 text-ink-muted" key={paragraph}>
            {paragraph}
          </p>
        ))}
      </section>

      <section className="grid gap-3">
        <h2 className="font-display text-2xl font-semibold">Вопросы</h2>
        {landing.faq.map((item) => (
          <details
            className="rounded-2xl border border-line bg-surface p-4"
            key={item.question}
            open
          >
            <summary className="cursor-pointer font-semibold">{item.question}</summary>
            <p className="mt-3 text-sm leading-6 text-ink-muted">{item.answer}</p>
          </details>
        ))}
      </section>

      <nav aria-label="Связанные разделы" className="grid gap-3">
        <h2 className="font-display text-2xl font-semibold">Связанные разделы</h2>
        <ul className="flex flex-wrap gap-3">
          {links.map((link) => (
            <li key={link.href}>
              <Link
                className="inline-block rounded-2xl border border-line px-4 py-2 text-sm font-semibold hover:border-brand"
                href={link.href}
              >
                {link.anchor}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}
