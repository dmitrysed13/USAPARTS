import Link from "next/link";

export function pageHref(base: string, page: number, extra: Record<string, string | undefined>) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(extra)) {
    if (value) params.set(key, value);
  }
  if (page > 1) params.set("page", String(page));
  const query = params.toString();
  return query ? `${base}?${query}` : base;
}

export function Pagination({
  page,
  pages,
  base,
  extra,
}: {
  page: number;
  pages: number;
  base: string;
  extra: Record<string, string | undefined>;
}) {
  if (pages <= 1) return null;
  const prev = page > 1 ? pageHref(base, page - 1, extra) : undefined;
  const next = page < pages ? pageHref(base, page + 1, extra) : undefined;
  return (
    <nav aria-label="Страницы" className="mt-6 flex items-center justify-between text-sm">
      {prev ? <Link rel="prev" href={prev} className="btn-ghost">Назад</Link> : <span />}
      <span>
        Страница {page} из {pages}
      </span>
      {next ? <Link rel="next" href={next} className="btn-ghost">Дальше</Link> : <span />}
    </nav>
  );
}
