import { pageByPath } from "../seo/pages.ts";
import type { QuoteSeed } from "../lib/validation.ts";
import { DocumentHead } from "./DocumentHead.tsx";
import { QuoteForm } from "./QuoteForm.tsx";
import { SiteLink } from "./SiteLink.tsx";
import { Container } from "./ui.tsx";

type ContentPageProps = {
  path: string;
  onDraft: (draft: import("../lib/validation.ts").QuoteDraft) => void;
  onPrivacy: () => void;
};

export function ContentPage({ path, onDraft, onPrivacy }: ContentPageProps) {
  const page = pageByPath(path);
  if (!page || page.kind === "home") return null;
  const seed: QuoteSeed = { token: 1, brand: page.brand ?? "", part: page.part ?? "" };

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
          <h1 className="display mt-6 max-w-4xl text-balance">{page.h1}</h1>
          <p className="mt-5 max-w-3xl text-base leading-relaxed text-mist sm:text-lg">{page.lead}</p>
        </Container>

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
            <h2 className="display-2">Вопросы по этой услуге</h2>
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

        <Container className="pt-10">
          <QuoteForm seed={seed} onDraft={onDraft} onPrivacy={onPrivacy} />
        </Container>
      </article>
    </>
  );
}
