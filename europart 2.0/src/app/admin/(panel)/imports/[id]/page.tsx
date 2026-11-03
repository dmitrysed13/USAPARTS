import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { buttonClassName } from "@/components/ui/button";
import { Field, controlClassName } from "@/components/ui/field";
import { getPrismaClient } from "@/lib/db/prisma";
import {
  importFieldIds,
  importFieldLabels,
  suggestMapping,
  type ColumnMapping,
} from "@/modules/imports/fields";
import { readSummary } from "@/modules/imports/report";

const actionLabel = {
  CREATE: "Создать",
  UPDATE: "Обновить предложение",
  ERROR: "Ошибка",
  DUPLICATE: "Дубль",
} as const;

function mappingFrom(value: unknown): ColumnMapping {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return {};
  }
  return value as ColumnMapping;
}

export default async function ImportJobPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const prisma = getPrismaClient();
  const job = await prisma.importJob.findUnique({
    where: { id },
    include: {
      rows: { orderBy: { rowNumber: "asc" }, take: 50 },
      template: true,
      supplier: { select: { name: true } },
      warehouse: { select: { name: true } },
    },
  });
  if (!job) {
    notFound();
  }
  const headers = Array.isArray(job.headers)
    ? job.headers.filter((item): item is string => typeof item === "string")
    : [];
  const saved = mappingFrom(job.mapping);
  const fromTemplate = mappingFrom(job.template?.mapping);
  const suggested =
    Object.keys(saved).length > 0
      ? saved
      : Object.keys(fromTemplate).length > 0
        ? fromTemplate
        : suggestMapping(headers);
  const summary = readSummary(job.summary);
  const raw = job.rawRows;
  const sample =
    raw &&
    typeof raw === "object" &&
    !Array.isArray(raw) &&
    Array.isArray((raw as { rows?: unknown }).rows)
      ? ((raw as { rows: { cells?: string[] }[] }).rows[0]?.cells ?? [])
      : [];
  const closed = job.status === "COMMITTED" || job.status === "ROLLED_BACK";

  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">{job.filename}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          {job.supplier?.name ?? "Свой склад"}
          {job.warehouse ? ` · ${job.warehouse.name}` : ""} · {job.status}
        </p>
        {summary && summary.sheetCount > 1 ? (
          <p className="mt-2 text-sm text-ink-muted">
            В книге несколько листов. Прочитан только первый.
          </p>
        ) : null}
      </div>
      {summary && job.status !== "UPLOADED" ? (
        <ul className="grid gap-3 sm:grid-cols-4">
          {[
            ["Создать", summary.create],
            ["Обновить", summary.update],
            ["Ошибки", summary.error],
            ["Дубли", summary.duplicate],
          ].map(([label, value]) => (
            <li className="rounded-2xl border border-line bg-surface p-4" key={label}>
              <span className="text-sm text-ink-muted">{label}</span>
              <span className="mt-1 block font-display text-2xl font-semibold">
                {value}
              </span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-ink-muted">
          Файл прочитан. Товары, цены и остатки ещё не изменены.
        </p>
      )}
      {!closed ? (
        <form
          action={`/api/admin/imports/${job.id}`}
          className="grid gap-4"
          method="post"
        >
          <input name="intent" type="hidden" value="preview" />
          <h2 className="font-display text-xl font-semibold">Колонки</h2>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[40rem] text-left text-sm">
              <thead>
                <tr className="border-b border-line text-ink-muted">
                  <th className="py-2 pr-3 font-medium">Колонка файла</th>
                  <th className="py-2 pr-3 font-medium">Пример</th>
                  <th className="py-2 font-medium">Поле системы</th>
                </tr>
              </thead>
              <tbody>
                {headers.map((header, index) => (
                  <tr className="border-b border-line" key={header}>
                    <td className="py-2 pr-3">{header}</td>
                    <td className="py-2 pr-3 text-ink-muted">{sample[index] || "—"}</td>
                    <td className="py-2">
                      <input name="header" type="hidden" value={header} />
                      <select
                        className={controlClassName}
                        defaultValue={suggested[header] ?? ""}
                        name="field"
                      >
                        <option value="">Не использовать</option>
                        {importFieldIds.map((field) => (
                          <option key={field} value={field}>
                            {importFieldLabels[field]}
                          </option>
                        ))}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {job.supplierId ? (
            <Field
              hint="Необязательно. Шаблон запомнится только для этого поставщика."
              htmlFor="template-name"
              label="Сохранить как шаблон"
            >
              <input
                className={controlClassName}
                id="template-name"
                name="templateName"
              />
            </Field>
          ) : null}
          <button className={buttonClassName()} type="submit">
            Сформировать предпросмотр
          </button>
        </form>
      ) : null}
      {job.status === "READY" && summary && summary.create + summary.update > 0 ? (
        <form action={`/api/admin/imports/${job.id}`} method="post">
          <input name="intent" type="hidden" value="commit" />
          <button className={buttonClassName()} type="submit">
            Применить строки «создать» и «обновить»
          </button>
          <p className="mt-2 text-sm text-ink-muted">
            Ошибки и дубли не записываются. Новая карточка останется черновиком. Закупка
            не подменяет розницу.
          </p>
        </form>
      ) : null}
      {job.status === "COMMITTED" ? (
        <form action={`/api/admin/imports/${job.id}`} method="post">
          <input name="intent" type="hidden" value="rollback" />
          <button className={buttonClassName("secondary")} type="submit">
            Откатить этот импорт
          </button>
        </form>
      ) : null}
      {job.rows.length > 0 ? (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[40rem] text-left text-sm">
            <thead>
              <tr className="border-b border-line text-ink-muted">
                <th className="py-2 pr-3 font-medium">Строка</th>
                <th className="py-2 pr-3 font-medium">Решение</th>
                <th className="py-2 font-medium">Комментарий</th>
              </tr>
            </thead>
            <tbody>
              {job.rows.map((row) => (
                <tr className="border-b border-line" key={row.id}>
                  <td className="py-2 pr-3">{row.rowNumber}</td>
                  <td className="py-2 pr-3">{actionLabel[row.action]}</td>
                  <td className="py-2">{row.message || "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : null}
      <Link className="text-sm font-semibold text-brand" href="/admin/imports/new">
        Загрузить другой файл
      </Link>
    </div>
  );
}
