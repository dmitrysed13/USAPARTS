import { connection } from "next/server";
import Link from "next/link";
import { loadResolvedLandings } from "@/modules/seo/landing-data";

export default async function SeoAdminPage() {
  await connection();
  const landings = await loadResolvedLandings();
  return (
    <div className="grid gap-6">
      <h1 className="font-display text-3xl font-semibold">Посадочные страницы</h1>
      <p className="max-w-2xl text-sm leading-6 text-ink-muted">
        Текст, FAQ и индекс правятся здесь. Новый адрес появляется только вместе с
        правилом в коде: произвольные страницы под запросы не создаются.
      </p>
      <ul className="grid gap-2">
        {landings.map((landing) => (
          <li
            className="flex flex-wrap items-baseline justify-between gap-3 rounded-control border border-line bg-surface px-4 py-3 text-sm"
            key={landing.slug}
          >
            <div>
              <Link
                className="font-semibold hover:text-brand"
                href={`/admin/seo/${landing.slug}`}
              >
                {landing.h1}
              </Link>
              <span className="text-ink-muted"> · {landing.path}</span>
            </div>
            <span className="text-ink-muted">
              {landing.published ? "опубликована" : "скрыта"}
              {" · "}
              {landing.indexable ? "index" : "noindex"}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
