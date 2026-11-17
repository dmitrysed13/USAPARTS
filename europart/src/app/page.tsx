import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { SearchField } from "@/components/catalog/search-field";
import { VehiclePicker } from "@/components/catalog/vehicle-picker";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { company as staticCompany } from "@/config/company";
import { getStorefrontCompany } from "@/modules/admin/company-settings";
import { readSelectedVehicle } from "@/modules/fitment/vehicle-http";

export const metadata: Metadata = {
  title: "Автозапчасти",
  description:
    "EUROPART — европейские автозапчасти для Беларуси. Каталог ждёт реальный ассортимент. Заказ через менеджера; онлайн-оплата — только при подключённом провайдере.",
  alternates: { canonical: "/" },
  robots: { index: false, follow: false },
};

const currentSteps = [
  "Оставляете заявку на действующем сайте",
  "Менеджер связывается и подтверждает заказ",
  "Оплачиваете удобным способом",
  "Забираете в Бресте или получаете доставкой",
];

async function HomeVehiclePicker() {
  const selected = await readSelectedVehicle();
  return (
    <VehiclePicker
      initial={
        selected
          ? {
              brandSlug: selected.brandSlug,
              modelSlug: selected.modelSlug,
              generationSlug: selected.generationSlug,
              modificationSlug: selected.modificationSlug,
              engineSlug: selected.engineSlug,
            }
          : undefined
      }
    />
  );
}

async function HomeContacts() {
  const company = await getStorefrontCompany();
  return (
    <address className="rounded-2xl bg-surface-muted p-6 not-italic">
      {company.showLegalBlock ? (
        <>
          <p className="font-semibold">{company.legalName}</p>
          {company.unp ? <p className="mt-1 text-sm">УНП {company.unp}</p> : null}
          {company.legalAddress ? <p className="mt-2">{company.legalAddress}</p> : null}
          {company.actualAddress ? (
            <p className="mt-1 text-sm text-ink-muted">{company.actualAddress}</p>
          ) : null}
        </>
      ) : (
        <p className="font-semibold">EUROPART</p>
      )}
      <p className="mt-4">
        <a className="font-semibold text-brand" href={`tel:${company.phoneTel}`}>
          {company.phoneDisplay}
        </a>
      </p>
      <p className="mt-4">
        <a
          className="underline decoration-line underline-offset-4"
          href={`mailto:${company.email}`}
        >
          {company.email}
        </a>
      </p>
      {company.hoursText ? (
        <p className="mt-4 text-sm text-ink-muted">{company.hoursText}</p>
      ) : null}
    </address>
  );
}

export default function HomePage() {
  return (
    <>
      <section className="bg-panel text-panel-foreground">
        <Container className="grid items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:py-24">
          <div>
            <p className="text-sm font-semibold text-brand">Беларусь · Минск-first</p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
              EUROPART
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-panel-foreground/78">
              Европейские автозапчасти для рынка Беларуси. Поиск по OEM/артикулу и VIN.
              Товары, цены и наличие появятся после загрузки реального ассортимента —
              без выдуманных данных.
            </p>
            <div className="mt-8 max-w-xl">
              <SearchField />
            </div>
            <div className="mt-4 flex flex-col gap-3 sm:flex-row">
              <Link className={buttonClassName("primary")} href="/catalog">
                Открыть каталог
              </Link>
              <Link className={buttonClassName("secondary-on-dark")} href="/vin-search">
                Заявка по VIN
              </Link>
              <a
                className={buttonClassName("ghost-on-dark")}
                href={`tel:${staticCompany.phoneTel}`}
              >
                {staticCompany.phoneDisplay}
              </a>
            </div>
          </div>
          <div aria-hidden="true" className="hidden justify-center lg:flex">
            <svg className="size-64 text-white/90" viewBox="0 0 200 200">
              <circle
                cx="100"
                cy="100"
                fill="none"
                r="78"
                stroke="currentColor"
                strokeWidth="8"
              />
              <circle
                cx="100"
                cy="100"
                fill="none"
                r="28"
                stroke="#d0121a"
                strokeWidth="10"
              />
              <circle cx="100" cy="100" fill="#d0121a" r="8" />
              <path
                d="M100 8v28M100 164v28M8 100h28M164 100h28"
                stroke="currentColor"
                strokeWidth="6"
              />
            </svg>
          </div>
        </Container>
      </section>

      <section className="border-b border-line py-12">
        <Container>
          <Suspense fallback={null}>
            <HomeVehiclePicker />
          </Suspense>
        </Container>
      </section>

      <section className="py-16">
        <Container>
          <h2 className="font-display text-3xl font-semibold tracking-tight">
            Как компания работает сейчас
          </h2>
          <p className="mt-3 max-w-2xl text-ink-muted">
            Шаги взяты с europart.by на 3 ноября 2026. Оплата и службы доставки для новой
            платформы ещё не подтверждены и не подключены.
          </p>
          <ol className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {currentSteps.map((step, index) => (
              <li
                className="rounded-2xl border border-line bg-surface-muted p-5"
                key={step}
              >
                <span className="font-display text-2xl font-semibold text-brand">
                  0{index + 1}
                </span>
                <p className="mt-3 text-sm leading-6">{step}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      <section className="pb-16" id="contacts">
        <Container className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
          <div>
            <h2 className="font-display text-3xl font-semibold tracking-tight">
              Контакты
            </h2>
            <p className="mt-3 text-ink-muted">
              Контакты с витрины. Юр. блоки и УНП появляются только после явной публикации
              полного профиля в админке — пустые и фейковые реквизиты не показываем.
            </p>
          </div>
          <Suspense
            fallback={
              <address className="rounded-2xl bg-surface-muted p-6 not-italic">
                <p className="font-semibold">EUROPART</p>
              </address>
            }
          >
            <HomeContacts />
          </Suspense>
        </Container>
      </section>
    </>
  );
}
