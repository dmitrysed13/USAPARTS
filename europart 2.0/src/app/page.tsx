import type { Metadata } from "next";
import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { company, formatAddress } from "@/config/company";

export const metadata: Metadata = {
  title: "Автозапчасти",
  description:
    "EUROPART, ООО «БелТРЭК», Брест. Новая платформа магазина ещё без каталога. Заказы принимаются на действующем сайте и по телефону.",
  alternates: { canonical: "/" },
};

const currentSteps = [
  "Оставляете заявку на действующем сайте",
  "Менеджер связывается и подтверждает заказ",
  "Оплачиваете удобным способом",
  "Забираете в Бресте или получаете доставкой",
];

export default function HomePage() {
  return (
    <>
      <section className="bg-panel text-panel-foreground">
        <Container className="grid items-center gap-12 py-16 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,0.8fr)] lg:py-24">
          <div>
            <p className="text-sm font-semibold text-brand">Брест · Беларусь</p>
            <h1 className="mt-4 max-w-xl font-display text-4xl font-semibold tracking-tight sm:text-6xl">
              Автозапчасти EUROPART
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-8 text-panel-foreground/78">
              Новая платформа магазина готовится к запуску. Каталога, цен и корзины здесь
              пока нет. Заявку можно оставить на действующем сайте или по телефону.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a className={buttonClassName("primary")} href={`tel:${company.phoneTel}`}>
                {company.phoneDisplay}
              </a>
              <a
                className={buttonClassName("secondary-on-dark")}
                href={company.currentWebsite}
                rel="noopener noreferrer"
              >
                Действующий сайт
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
              Данные сверены с публичной страницей europart.by. УНП, банк и юридические
              тексты на ней не были указаны.
            </p>
          </div>
          <address className="rounded-2xl bg-surface-muted p-6 not-italic">
            <p className="font-semibold">{company.legalName}</p>
            <p className="mt-2">{formatAddress()}</p>
            <p className="mt-4">
              <a className="font-semibold text-brand" href={`tel:${company.phoneTel}`}>
                {company.phoneDisplay}
              </a>
            </p>
            <p className="text-sm text-ink-muted">{company.phoneNote}</p>
            <p className="mt-4">
              <a
                className="underline decoration-line underline-offset-4"
                href={`mailto:${company.email}`}
              >
                {company.email}
              </a>
            </p>
            <ul className="mt-4 space-y-1 text-sm text-ink-muted">
              {company.hours.map((slot) => (
                <li key={slot.days}>
                  {slot.days}: {slot.time}
                </li>
              ))}
            </ul>
          </address>
        </Container>
      </section>

      <section className="border-t border-line py-12">
        <Container className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <p className="max-w-xl text-sm leading-6 text-ink-muted">
            Цвета, шрифты, кнопки, поля и состояния интерфейса собраны отдельно от
            каталога.
          </p>
          <Link className={buttonClassName("secondary")} href="/design-system">
            Открыть дизайн-систему
          </Link>
        </Container>
      </section>
    </>
  );
}
