import Link from "next/link";

export function Pagination({
  page,
  pageSize,
  total,
  hrefFor,
}: {
  page: number;
  pageSize: number;
  total: number;
  hrefFor: (page: number) => string;
}) {
  const pages = Math.ceil(total / pageSize);
  if (pages <= 1) {
    return null;
  }
  const previous = page > 1 ? page - 1 : null;
  const next = page < pages ? page + 1 : null;

  return (
    <nav aria-label="Страницы" className="mt-8 flex flex-wrap items-center gap-3">
      {previous ? (
        <Link
          className="rounded-control border border-line px-4 py-2 text-sm font-semibold hover:border-brand"
          href={hrefFor(previous)}
        >
          Назад
        </Link>
      ) : null}
      <p className="text-sm text-ink-muted">
        Страница {page} из {pages}
      </p>
      {next ? (
        <Link
          className="rounded-control border border-line px-4 py-2 text-sm font-semibold hover:border-brand"
          href={hrefFor(next)}
        >
          Дальше
        </Link>
      ) : null}
    </nav>
  );
}
