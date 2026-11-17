import Link from "next/link";
import { EmptyState } from "@/components/ui/state";

export function AdminPageHeader({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="font-display text-3xl font-semibold tracking-tight">{title}</h1>
        {description ? <p className="mt-2 max-w-2xl text-ink-muted">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function AdminTable({
  columns,
  rows,
  emptyTitle,
  emptyDescription,
}: {
  columns: string[];
  rows: Array<Array<React.ReactNode>>;
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (rows.length === 0) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }
  return (
    <div className="overflow-x-auto rounded-2xl border border-line bg-surface">
      <table className="min-w-full text-left text-sm">
        <thead className="border-b border-line bg-surface-muted/60 text-ink-muted">
          <tr>
            {columns.map((column) => (
              <th className="px-4 py-3 font-medium" key={column}>
                {column}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr className="border-b border-line last:border-0" key={index}>
              {row.map((cell, cellIndex) => (
                <td className="px-4 py-3 align-top" key={cellIndex}>
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function AdminStub({
  title,
  nextStage,
}: {
  title: string;
  nextStage: string;
}) {
  return (
    <EmptyState
      description={`Раздел «${title}» подготовлен структурно. Полный ${nextStage} подключится отдельным этапом. Данные не выдумываются.`}
      title={`${title} — заглушка`}
    />
  );
}

export function AdminApiHint({ path }: { path: string }) {
  return (
    <p className="mt-4 text-sm text-ink-muted">
      API: <code className="rounded bg-surface-muted px-1">{path}</code>. Для автоматизации —
      Bearer <code className="rounded bg-surface-muted px-1">ADMIN_API_TOKEN</code>.
    </p>
  );
}

export function AdminBackLink() {
  return (
    <Link className="text-sm font-semibold text-brand hover:text-brand-strong" href="/admin">
      ← Dashboard
    </Link>
  );
}
