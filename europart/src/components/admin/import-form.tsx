"use client";

import { useActionState } from "react";
import { buttonClassName } from "@/components/ui/button";
import { controlClassName, Field } from "@/components/ui/field";
import { uploadImportAction } from "@/modules/admin/import-action";

export function ImportForm({
  suppliers,
  warehouses,
}: {
  suppliers: Array<{ id: string; name: string }>;
  warehouses: Array<{ id: string; name: string }>;
}) {
  const [state, action, pending] = useActionState(uploadImportAction, {
    error: null,
    ok: false,
  });

  return (
    <form
      action={action}
      className="grid max-w-xl gap-4 rounded-2xl border border-line bg-surface p-5"
      encType="multipart/form-data"
    >
      <Field htmlFor="file" label="Файл">
        <input className={controlClassName} id="file" name="file" required type="file" />
      </Field>
      <Field htmlFor="sourceType" label="Источник">
        <select
          className={controlClassName}
          defaultValue="SUPPLIER"
          id="sourceType"
          name="sourceType"
        >
          <option value="SUPPLIER">Поставщик</option>
          <option value="OWN_STOCK">Свой склад</option>
        </select>
      </Field>
      <Field htmlFor="delimiter" label="Разделитель">
        <select className={controlClassName} defaultValue="auto" id="delimiter" name="delimiter">
          <option value="auto">Авто</option>
          <option value="semicolon">;</option>
          <option value="comma">,</option>
        </select>
      </Field>
      <Field htmlFor="supplierId" label="Поставщик">
        <select className={controlClassName} id="supplierId" name="supplierId">
          <option value="">—</option>
          {suppliers.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </Field>
      <Field htmlFor="warehouseId" label="Склад">
        <select className={controlClassName} id="warehouseId" name="warehouseId">
          <option value="">—</option>
          {warehouses.map((row) => (
            <option key={row.id} value={row.id}>
              {row.name}
            </option>
          ))}
        </select>
      </Field>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-ink-muted" role="status">
          Файл принят.
        </p>
      ) : null}
      <button className={buttonClassName("primary")} disabled={pending} type="submit">
        {pending ? "Загружаем…" : "Загрузить"}
      </button>
    </form>
  );
}
