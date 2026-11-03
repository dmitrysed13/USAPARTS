import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { SupplierForm } from "@/components/admin/supplier-form";
import { buttonClassName } from "@/components/ui/button";
import { getSupplier } from "@/modules/admin/suppliers";

export default async function SupplierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const supplier = await getSupplier(id);
  if (!supplier) {
    notFound();
  }
  return (
    <div className="grid max-w-3xl gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">{supplier.name}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Шаблоны колонок сохраняются отдельно для этого поставщика.
        </p>
      </div>
      <SupplierForm action={`/api/admin/suppliers/${supplier.id}`} supplier={supplier} />
      <form action={`/api/admin/suppliers/${supplier.id}`} method="post">
        <input name="intent" type="hidden" value="deactivate" />
        <button className={buttonClassName("secondary")} type="submit">
          Отключить поставщика
        </button>
      </form>
      <form action={`/api/admin/suppliers/${supplier.id}/probe`} method="post">
        <button className={buttonClassName("secondary")} type="submit">
          Проверить API
        </button>
        <p className="mt-2 text-sm text-ink-muted">
          Проверка не подставляет товары. Пока нет реального адаптера, ответ будет
          отказом, даже если имя переменной заполнено.
        </p>
      </form>
      <section className="grid gap-3">
        <h2 className="font-display text-xl font-semibold">Шаблоны импорта</h2>
        {supplier.importTemplates.length === 0 ? (
          <p className="text-sm text-ink-muted">
            Шаблонов пока нет. Их можно сохранить на экране предпросмотра прайса.
          </p>
        ) : (
          <ul className="grid gap-2 text-sm">
            {supplier.importTemplates.map((template) => (
              <li
                className="rounded-control border border-line px-3 py-2"
                key={template.id}
              >
                {template.name}
              </li>
            ))}
          </ul>
        )}
        <Link
          className={buttonClassName()}
          href={`/admin/imports/new?supplier=${supplier.id}`}
        >
          Загрузить прайс этого поставщика
        </Link>
      </section>
    </div>
  );
}
