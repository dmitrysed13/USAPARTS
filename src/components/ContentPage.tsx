import { useState } from "react";
import { yearOptions } from "../content.ts";
import { pageByPath } from "../seo/pages.ts";
import type { QuoteSeed } from "../lib/validation.ts";
import { DocumentHead } from "./DocumentHead.tsx";
import { QuoteForm } from "./QuoteForm.tsx";
import { SiteLink } from "./SiteLink.tsx";
import { VehicleArt } from "./VehicleArt.tsx";
import { Container } from "./ui.tsx";

type ContentPageProps = {
  path: string;
  onDraft: (draft: import("../lib/validation.ts").QuoteDraft) => void;
  onPrivacy: () => void;
};

const requestKinds = new Set(["model", "part", "generation"]);

export function ContentPage({ path, onDraft, onPrivacy }: ContentPageProps) {
  const page = pageByPath(path);
  const [generation, setGeneration] = useState("");
  const [year, setYear] = useState("");
  const [engine, setEngine] = useState("");
  const [seed, setSeed] = useState<QuoteSeed>({
    token: 1,
    brand: page?.brand ?? "",
    part: page?.part ?? "",
    model: page?.modelName ?? "",
  });

  if (!page || page.kind === "home") return null;

  const years = yearOptions();
  const showRequest = requestKinds.has(page.kind);
  const applyRequest = (focus: QuoteSeed["focus"]) => {
    const modelName = [page.modelName, generation].filter(Boolean).join(" ");
    const partName = [page.part, engine ? `ориентир: ${engine}` : ""].filter(Boolean).join(". ");
    setSeed({
      token: Date.now(),
      brand: page.brand ?? "",
      model: modelName,
      year,
      part: partName,
      focus,
    });
    document.getElementById("podbor")?.scrollIntoView({ behavior: "smooth", block: "center" });
  };

  return (
    <>
      <DocumentHead page={page} title={page.title} description={page.description} path={page.path} robots="index, follow" />
      <article className="pb-20">
        <Container className="pt-8 sm:pt-12">
          <nav aria-label="Хлебные крошки" className="text-sm text-mist">
            <ol className="flex flex-wrap gap-x-2 gap-y-1">
              {page.crumbs.map((crumb, index) => (
                <li key={crumb.path} className="inline-flex items-center gap-2">
                  {index > 0 ? <span aria-hidden="true">/</span> : null}
                  {index === page.crumbs.length - 1 ? (
                    <span className="text-paper">{crumb.name}</span>
                  ) : (
                    <SiteLink href={crumb.path} className="hover:text-ember">
                      {crumb.name}
                    </SiteLink>
                  )}
                </li>
              ))}
            </ol>
          </nav>
          <div className={`mt-6 grid items-center gap-8 ${page.visual ? "lg:grid-cols-[1.15fr_0.85fr]" : ""}`}>
            <div>
              <h1 className="display max-w-4xl text-balance">{page.h1}</h1>
              <p className="mt-5 max-w-3xl text-base leading-relaxed text-mist sm:text-lg">{page.lead}</p>
              {showRequest ? (
                <div className="mt-6 flex flex-wrap gap-2">
                  <button type="button" className="btn btn-primary" onClick={() => applyRequest("part")}>
                    Подобрать запчасть
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => applyRequest("phone")}>
                    Рассчитать стоимость
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => applyRequest("vin")}>
                    Отправить VIN
                  </button>
                </div>
              ) : null}
            </div>
            {page.visual ? <VehicleArt style={page.visual} label={page.h1} /> : null}
          </div>
        </Container>

        {page.cards && page.cards.length > 0 ? (
          <Container className="pt-10">
            <h2 className="display-2 max-w-3xl text-balance">{page.kind === "model" ? "Популярные категории" : "Разделы"}</h2>
            <ul className="mt-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {page.cards.map((card) => (
                <li key={card.href} className="min-w-0">
                  <SiteLink href={card.href} className="card flex h-full flex-col p-4 hover:border-ember">
                    <span className="font-semibold text-paper">{card.title}</span>
                    <span className="mt-2 text-sm leading-relaxed text-mist">{card.text}</span>
                  </SiteLink>
                </li>
              ))}
            </ul>
          </Container>
        ) : null}

        {page.fitment ? (
          <Container className="pt-10">
            <h2 className="display-2 max-w-3xl text-balance">Поколение, год и двигатель</h2>
            <p className="mt-4 max-w-3xl text-sm leading-relaxed text-mist">
              Выбор сужает заявку и не меняет адрес страницы. Совместимость детали подтверждается VIN или OEM, не названием поколения.
            </p>
            <div className="mt-5 grid gap-3 sm:grid-cols-3">
              <label className="grid gap-1.5 text-sm">
                <span className="text-mist">Поколение</span>
                <select className="field" value={generation} onChange={(event) => setGeneration(event.target.value)}>
                  <option value="">Не выбрано</option>
                  {page.fitment.generations.map((item) => (
                    <option key={item.label} value={item.label}>
                      {item.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-mist">Год для заявки</span>
                <select className="field" value={year} onChange={(event) => setYear(event.target.value)}>
                  <option value="">Год</option>
                  {years.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-sm">
                <span className="text-mist">Двигатель как ориентир</span>
                <select className="field" value={engine} onChange={(event) => setEngine(event.target.value)}>
                  <option value="">Не выбран</option>
                  {page.fitment.engines.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            {page.fitment.generations.some((item) => item.href) ? (
              <ul className="mt-4 flex flex-wrap gap-2">
                {page.fitment.generations
                  .filter((item) => item.href)
                  .map((item) => (
                    <li key={item.href}>
                      <SiteLink href={item.href ?? ""} className="inline-flex text-sm font-semibold text-ember">
                        Страница поколения {item.label}
                      </SiteLink>
                    </li>
                  ))}
              </ul>
            ) : null}
            <button type="button" className="btn btn-ghost mt-4" onClick={() => applyRequest("part")}>
              Перенести в заявку
            </button>
          </Container>
        ) : null}

        {showRequest ? (
          <Container className="pt-10">
            <QuoteForm seed={seed} onDraft={onDraft} onPrivacy={onPrivacy} />
          </Container>
        ) : null}

        {page.sections.map((section) => (
          <Container key={section.heading} className="pt-10">
            <h2 className="display-2 max-w-3xl text-balance">{section.heading}</h2>
            {section.paragraphs.map((paragraph) => (
              <p key={paragraph} className="mt-4 max-w-3xl text-base leading-relaxed text-mist">
                {paragraph}
              </p>
            ))}
            {section.points ? (
              <ul className="mt-4 max-w-3xl list-disc space-y-2 pl-5 text-sm leading-relaxed text-paper">
                {section.points.map((point) => (
                  <li key={point}>{point}</li>
                ))}
              </ul>
            ) : null}
          </Container>
        ))}

        {page.table ? (
          <Container className="pt-10">
            <h2 className="display-2 max-w-3xl text-balance">{page.table.caption}</h2>
            <div className="mt-5 min-w-0 overflow-x-auto border border-line">
              <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
                <caption className="sr-only">{page.table.caption}</caption>
                <thead className="bg-panel text-mist">
                  <tr>
                    {page.table.columns.map((column) => (
                      <th key={column} scope="col" className="px-4 py-3 font-semibold">
                        {column}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {page.table.rows.map((row) => (
                    <tr key={row.join("|")} className="border-t border-line">
                      {row.map((cell) => (
                        <td key={cell} className="px-4 py-3 align-top">
                          {cell}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Container>
        ) : null}

        {page.faq.length > 0 ? (
          <Container className="pt-10">
            <h2 className="display-2">{showRequest ? "Вопросы по этой модели" : "Вопросы по этой услуге"}</h2>
            <div className="mt-4 max-w-3xl divide-y divide-line border-y border-line">
              {page.faq.map((item) => (
                <details key={item.question} className="group py-4">
                  <summary className="cursor-pointer text-base font-semibold">{item.question}</summary>
                  <p className="mt-2 text-sm leading-relaxed text-mist">{item.answer}</p>
                </details>
              ))}
            </div>
          </Container>
        ) : null}

        <Container className="pt-10">
          <h2 className="text-lg font-semibold">Смежные разделы</h2>
          <ul className="mt-3 flex flex-wrap gap-2">
            {page.related.map((item) => (
              <li key={item.path}>
                <SiteLink href={item.path} className="inline-flex border border-line px-3 py-2 text-sm hover:border-ember hover:text-ember">
                  {item.name}
                </SiteLink>
              </li>
            ))}
          </ul>
        </Container>

        {showRequest ? null : (
          <Container className="pt-10">
            <QuoteForm seed={seed} onDraft={onDraft} onPrivacy={onPrivacy} />
          </Container>
        )}
      </article>
    </>
  );
}
