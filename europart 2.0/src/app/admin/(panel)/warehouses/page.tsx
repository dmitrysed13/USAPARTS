import { connection } from "next/server";
import { buttonClassName } from "@/components/ui/button";
import { Field, controlClassName } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/state";
import { listSuppliers } from "@/modules/admin/suppliers";
import { listWarehouses } from "@/modules/admin/warehouses";

export default async function WarehousesPage() {
  await connection();
  const [warehouses, suppliers] = await Promise.all([listWarehouses(), listSuppliers()]);
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-3xl font-semibold">Склады</h1>
      {warehouses.length === 0 ? (
        <EmptyState
          description="Свой склад нужен для остатков EUROPART. Склад поставщика привязывается к поставщику."
          title="Складов пока нет"
        />
      ) : (
        <ul className="grid gap-3">
          {warehouses.map((warehouse) => (
            <li
              className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-line bg-surface p-4"
              key={warehouse.id}
            >
              <div>
                <p className="font-semibold">{warehouse.name}</p>
                <p className="text-sm text-ink-muted">
                  {warehouse.code} · {warehouse.type === "OWN" ? "свой" : "поставщик"}
                  {warehouse.supplier ? ` · ${warehouse.supplier.name}` : ""}
                  {warehouse.city ? ` · ${warehouse.city}` : ""}
                  {warehouse.isActive ? "" : " · отключён"}
                </p>
              </div>
              {warehouse.isActive ? (
                <form action="/api/admin/warehouses" method="post">
                  <input name="intent" type="hidden" value="deactivate" />
                  <input name="id" type="hidden" value={warehouse.id} />
                  <button className={buttonClassName("secondary")} type="submit">
                    Отключить
                  </button>
                </form>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form action="/api/admin/warehouses" className="grid max-w-xl gap-4" method="post">
        <h2 className="font-display text-xl font-semibold">Новый склад</h2>
        <Field htmlFor="warehouse-name" label="Название">
          <input className={controlClassName} id="warehouse-name" name="name" required />
        </Field>
        <Field htmlFor="warehouse-code" label="Код">
          <input className={controlClassName} id="warehouse-code" name="code" required />
        </Field>
        <Field htmlFor="warehouse-type" label="Тип">
          <select
            className={controlClassName}
            defaultValue="OWN"
            id="warehouse-type"
            name="type"
          >
            <option value="OWN">Свой склад EUROPART</option>
            <option value="SUPPLIER">Склад поставщика</option>
          </select>
        </Field>
        <Field htmlFor="warehouse-supplier" label="Поставщик">
          <select
            className={controlClassName}
            defaultValue=""
            id="warehouse-supplier"
            name="supplierId"
          >
            <option value="">Не выбран</option>
            {suppliers.map((supplier) => (
              <option key={supplier.id} value={supplier.id}>
                {supplier.name}
              </option>
            ))}
          </select>
        </Field>
        <Field htmlFor="warehouse-city" label="Город">
          <input className={controlClassName} id="warehouse-city" name="city" />
        </Field>
        <button className={buttonClassName()} type="submit">
          Добавить склад
        </button>
      </form>
    </div>
  );
}
