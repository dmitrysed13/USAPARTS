import Link from "next/link";
import { connection } from "next/server";
import { buttonClassName } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/state";
import { listSuppliers } from "@/modules/admin/suppliers";

export default async function SuppliersPage() {
  await connection();
  const suppliers = await listSuppliers();
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Поставщики</h1>
        <Link className={buttonClassName()} href="/admin/suppliers/new">
          Добавить
        </Link>
      </div>
      {suppliers.length === 0 ? (
        <EmptyState
          description="Добавьте поставщика, чтобы сохранить для него шаблон колонок и загрузить прайс."
          title="Поставщиков пока нет"
        />
      ) : (
        <ul className="grid gap-3">
          {suppliers.map((supplier) => (
            <li key={supplier.id}>
              <Link
                className="block rounded-2xl border border-line bg-surface p-4 hover:border-brand"
                href={`/admin/suppliers/${supplier.id}`}
              >
                <span className="font-semibold">{supplier.name}</span>
                <span className="mt-1 block text-sm text-ink-muted">
                  {supplier.code}
                  {supplier.isActive ? "" : " · отключён"}
                  {supplier.apiEnabled ? " · API отмечен, но вызов ещё не подключён" : ""}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
