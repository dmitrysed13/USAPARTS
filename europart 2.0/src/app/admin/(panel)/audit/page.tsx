import { connection } from "next/server";
import { EmptyState } from "@/components/ui/state";
import { listAudit } from "@/modules/admin/audit";

export default async function AuditPage() {
  await connection();
  const rows = await listAudit(100);
  return (
    <div className="grid gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Журнал</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Сейчас в системе один общий вход, поэтому автор записи — admin. Имена
          сотрудников появятся вместе с учётными записями.
        </p>
      </div>
      {rows.length === 0 ? (
        <EmptyState
          description="Записи появятся после поставщиков, товаров и импорта."
          title="Журнал пуст"
        />
      ) : (
        <ul className="grid gap-2">
          {rows.map((row) => (
            <li
              className="rounded-2xl border border-line bg-surface p-4 text-sm"
              key={row.id}
            >
              <p className="font-semibold">{row.summary}</p>
              <p className="mt-1 text-ink-muted">
                {row.actor} · {row.action} · {row.entityType}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
