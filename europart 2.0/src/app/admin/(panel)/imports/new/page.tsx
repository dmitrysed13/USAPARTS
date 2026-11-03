import { connection } from "next/server";
import { buttonClassName } from "@/components/ui/button";
import { Field, controlClassName } from "@/components/ui/field";
import { getPrismaClient } from "@/lib/db/prisma";

export default async function NewImportPage({
  searchParams,
}: {
  searchParams: Promise<{ supplier?: string }>;
}) {
  await connection();
  const { supplier = "" } = await searchParams;
  const prisma = getPrismaClient();
  const [suppliers, warehouses, templates] = await Promise.all([
    prisma.supplier.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.warehouse.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    prisma.importTemplate.findMany({
      orderBy: { name: "asc" },
      include: { supplier: true },
    }),
  ]);
  return (
    <div className="grid max-w-xl gap-6">
      <div>
        <h1 className="font-display text-3xl font-semibold">Загрузка прайса</h1>
        <p className="mt-2 text-sm leading-6 text-ink-muted">
          Файл только читается. Цены и остатки изменятся после предпросмотра и отдельного
          подтверждения. XLS не принимается: сохраните книгу как XLSX или CSV UTF-8.
        </p>
      </div>
      <form
        action="/api/admin/imports"
        className="grid gap-4"
        encType="multipart/form-data"
        method="post"
      >
        <Field htmlFor="source" label="Источник">
          <select
            className={controlClassName}
            defaultValue="SUPPLIER"
            id="source"
            name="sourceType"
          >
            <option value="SUPPLIER">Поставщик</option>
            <option value="OWN_STOCK">Свой склад</option>
          </select>
        </Field>
        <Field htmlFor="supplier" label="Поставщик">
          <select
            className={controlClassName}
            defaultValue={supplier}
            id="supplier"
            name="supplierId"
          >
            <option value="">Не выбран</option>
            {suppliers.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name}
              </option>
            ))}
          </select>
        </Field>
        <Field htmlFor="warehouse" label="Склад">
          <select
            className={controlClassName}
            defaultValue=""
            id="warehouse"
            name="warehouseId"
          >
            <option value="">Не выбран</option>
            {warehouses.map((item) => (
              <option key={item.id} value={item.id}>
                {item.name} · {item.type === "OWN" ? "свой" : "поставщик"}
              </option>
            ))}
          </select>
        </Field>
        <Field
          hint="Шаблон только подскажет колонки. Запись всё равно потребует подтверждения."
          htmlFor="template"
          label="Шаблон поставщика"
        >
          <select
            className={controlClassName}
            defaultValue=""
            id="template"
            name="templateId"
          >
            <option value="">Без шаблона</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.supplier.name}: {template.name}
              </option>
            ))}
          </select>
        </Field>
        <Field htmlFor="delimiter" label="Разделитель CSV">
          <select
            className={controlClassName}
            defaultValue="auto"
            id="delimiter"
            name="delimiter"
          >
            <option value="auto">Определить автоматически</option>
            <option value="semicolon">Точка с запятой</option>
            <option value="comma">Запятая</option>
          </select>
        </Field>
        <Field hint="До 5 МБ и 2000 строк." htmlFor="file" label="Файл CSV или XLSX">
          <input
            accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            className={controlClassName}
            id="file"
            name="file"
            required
            type="file"
          />
        </Field>
        <button className={buttonClassName()} type="submit">
          Прочитать файл
        </button>
      </form>
    </div>
  );
}
