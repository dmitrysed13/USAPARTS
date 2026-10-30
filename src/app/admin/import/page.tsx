"use client";

import { useActionState } from "react";
import Link from "next/link";
import { importCatalogAction, type ImportState } from "@/server/actions/import";

export default function ImportPage() {
  const [state, action, pending] = useActionState(importCatalogAction, null as ImportState);
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Импорт и экспорт</h1>
      <p className="mt-2 max-w-2xl text-sm leading-6">
        CSV или XLSX. Колонки: sku, name, slug, price, currency, quantity, condition, stockStatus, categorySlug, oem, manufacturer, description, makeSlug, modelSlug, year, isPublished, isDemo.
        Пустая цена остаётся пустой. Существующий артикул обновляется.
      </p>
      <p className="mt-3"><Link className="text-navy underline" href="/api/admin/products/export">Скачать CSV</Link></p>
      <form action={action} className="card mt-4 space-y-3 p-4">
        <input name="file" type="file" accept=".csv,.xlsx,text/csv" required />
        <button className="btn-navy" disabled={pending}>{pending ? "Импорт…" : "Импортировать"}</button>
      </form>
      {state && (
        <div className="mt-4 text-sm">
          <p>Создано: {state.created}. Обновлено: {state.updated}.</p>
          {state.errors.length > 0 && <ul className="mt-2 list-disc pl-5 text-rose-800">{state.errors.map((error) => <li key={error}>{error}</li>)}</ul>}
        </div>
      )}
    </div>
  );
}
