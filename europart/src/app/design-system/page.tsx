import type { Metadata } from "next";
import { PhoneFieldCheck } from "@/components/design-system/phone-field-check";
import { Badge } from "@/components/ui/badge";
import { Button, buttonClassName } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Container } from "@/components/ui/container";
import { controlClassName, Field } from "@/components/ui/field";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState, ErrorState } from "@/components/ui/state";
import { palette, typeScale } from "@/design/tokens";
import {
  availabilityLabels,
  availabilityStatuses,
} from "@/modules/commerce/availability";

export const metadata: Metadata = {
  title: "Дизайн-система",
  description:
    "Базовые цвета, типографика и компоненты EUROPART. Страница не для индексации.",
  alternates: { canonical: "/design-system" },
  robots: { index: false, follow: false },
};

export default function DesignSystemPage() {
  return (
    <Container className="space-y-16 py-12 sm:py-16">
      <header className="max-w-3xl">
        <p className="text-sm font-semibold text-brand">Этап 1</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Дизайн-система EUROPART
        </h1>
        <p className="mt-4 text-lg leading-8 text-ink-muted">
          Образцы интерфейса. Здесь нет товаров, цен и отзывов: карточка ниже показывает
          только устройство будущей витрины.
        </p>
      </header>

      <section>
        <h2 className="font-display text-2xl font-semibold">Цвет</h2>
        <ul className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {palette.map((color) => (
            <li
              className="overflow-hidden rounded-2xl border border-line"
              key={color.cssVariable}
            >
              <div className="h-16" style={{ background: color.hex }} />
              <div className="px-3 py-3 text-sm">
                <p className="font-medium">{color.name}</p>
                <p className="text-ink-muted">{color.hex}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Типографика</h2>
        <div className="mt-6 space-y-6">
          {typeScale.map((item) => (
            <div className="border-b border-line pb-5" key={item.name}>
              <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
                {item.name}
              </p>
              <p className={`mt-2 ${item.className}`}>{item.sample}</p>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Кнопки</h2>
        <div className="mt-6 flex flex-wrap gap-3">
          <Button variant="primary">Основная</Button>
          <Button variant="secondary">Тёмная</Button>
          <Button variant="ghost">Тихая</Button>
          <Button disabled variant="primary">
            Недоступна
          </Button>
          <span
            aria-busy="true"
            className={buttonClassName("primary", "pointer-events-none")}
          >
            <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" />
            Загрузка
          </span>
        </div>
        <p className="mt-3 text-sm text-ink-muted">
          Кнопка «Загрузка» показывает состояние и не запускает действие.
        </p>
        <div className="mt-4 rounded-2xl bg-panel p-4">
          <button className={buttonClassName("secondary-on-dark")} type="button">
            На тёмном фоне
          </button>
        </div>
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <div>
          <h2 className="font-display text-2xl font-semibold">Поля</h2>
          <div className="mt-6 grid gap-5">
            <PhoneFieldCheck />
            <Field
              hint="Поле выключено, потому что выбор ещё не подключён."
              htmlFor="sample-disabled"
              label="Марка"
            >
              <input
                className={controlClassName}
                disabled
                id="sample-disabled"
                placeholder="Марка"
              />
            </Field>
          </div>
        </div>
        <div>
          <h2 className="font-display text-2xl font-semibold">Наличие</h2>
          <ul className="mt-6 flex flex-wrap gap-2">
            {availabilityStatuses.map((status) => (
              <li key={status}>
                <Badge status={status}>{availabilityLabels[status]}</Badge>
              </li>
            ))}
          </ul>
          <div className="mt-8">
            <h3 className="font-display text-lg font-semibold">Загрузка</h3>
            <div className="mt-4 grid gap-3">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-28 w-full" />
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold">Карточка интерфейса</h2>
        <Card className="mt-6 max-w-sm overflow-hidden">
          <div className="flex h-44 items-center justify-center bg-surface-muted text-sm text-ink-muted">
            Фото товара
          </div>
          <div className="space-y-3 p-5">
            <p className="text-xs font-semibold tracking-wide text-ink-muted uppercase">
              Артикул
            </p>
            <h3 className="font-display text-xl font-semibold">Название детали</h3>
            <p className="text-sm text-ink-muted">Производитель · оригинал или аналог</p>
            <p className="text-sm text-ink-muted">
              Цена и наличие подставляются из предложения.
            </p>
            <p className="rounded-control border border-dashed border-line px-4 py-3 text-center text-sm text-ink-muted">
              Место кнопки «В корзину»
            </p>
          </div>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-2">
        <EmptyState
          description="Когда в категории появятся реальные позиции, они будут показаны здесь."
          title="В этой категории пока пусто"
        />
        <ErrorState
          description="Сервер не подтвердил операцию. Заказ, оплата и заявка в этом случае не считаются созданными."
          title="Не удалось выполнить действие"
        />
      </section>
    </Container>
  );
}
