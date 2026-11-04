import { pages } from "../seo/pages.ts";
import { SiteLink } from "./SiteLink.tsx";
import { Container } from "./ui.tsx";

const groups = [
  { title: "Услуги", kind: "service" },
  { title: "Марки", kind: "brand" },
  { title: "Категории", kind: "category" },
] as const;

export function Guide() {
  return (
    <section id="sections" className="border-t border-line py-16 sm:py-24">
      <Container>
        <p className="eyebrow">06 — Разделы</p>
        <h2 className="display-2 mt-3 max-w-3xl text-balance">Новые, б/у и подбор по VIN</h2>
        <div className="mt-8 grid gap-3 lg:grid-cols-2">
          <article className="card p-5 sm:p-6">
            <h3 className="font-display text-3xl leading-none">Новая деталь</h3>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              Со склада или от дилера в США. В расчёте отдельно написано, оригинал это или аналог.
            </p>
            <SiteLink href="/novye-avtozapchasti/" className="mt-4 inline-flex text-sm font-semibold text-ember">
              Новые запчасти
            </SiteLink>
          </article>
          <article className="card p-5 sm:p-6">
            <h3 className="font-display text-3xl leading-none">Б/у с разборки</h3>
            <p className="mt-3 text-sm leading-relaxed text-mist">
              Фото лота, пробег и повреждения показываем до выкупа. Б/у не называем новой.
            </p>
            <SiteLink href="/b-u-avtozapchasti/" className="mt-4 inline-flex text-sm font-semibold text-ember">
              Б/у запчасти
            </SiteLink>
          </article>
        </div>

        <div className="mt-10 max-w-3xl">
          <h2 className="display-2 text-balance">Как подобрать запчасть по VIN</h2>
          <ol className="mt-4 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-mist">
            <li>Возьмите 17 знаков из свидетельства или с таблички автомобиля.</li>
            <li>Напишите название детали и, если есть, OEM-номер.</li>
            <li>Укажите, нужна новая деталь или б/у.</li>
            <li>До оплаты сверяем номер и называем срок: обычно 15–30 дней после выкупа в США.</li>
          </ol>
          <SiteLink href="/podbor-po-vin/" className="mt-4 inline-flex text-sm font-semibold text-ember">
            Подробнее о подборе по VIN
          </SiteLink>
        </div>

        <div className="mt-10 max-w-3xl">
          <h2 className="display-2 text-balance">Каталог по моделям</h2>
          <p className="mt-4 text-sm leading-relaxed text-mist">
            Сорок моделей с американского рынка. У каждой есть свои категории. Поколение и двигатель попадают в заявку, но не создают отдельный адрес, пока для них нет своего текста.
          </p>
          <SiteLink href="/avtozapchasti/" className="mt-4 inline-flex text-sm font-semibold text-ember">
            Открыть каталог моделей
          </SiteLink>
        </div>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {groups.map((group) => (
            <nav key={group.kind} aria-label={group.title}>
              <h3 className="text-sm font-semibold uppercase tracking-[0.14em] text-ember">{group.title}</h3>
              <ul className="mt-3 space-y-2">
                {pages
                  .filter((page) => page.kind === group.kind)
                  .map((page) => (
                    <li key={page.path}>
                      <SiteLink href={page.path} className="text-sm text-mist hover:text-paper">
                        {page.h1}
                      </SiteLink>
                    </li>
                  ))}
              </ul>
            </nav>
          ))}
        </div>
      </Container>
    </section>
  );
}
