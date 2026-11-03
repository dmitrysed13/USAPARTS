import { connection } from "next/server";
import { buttonClassName } from "@/components/ui/button";
import { Field, controlClassName } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/state";
import { listPartBrands } from "@/modules/admin/catalog-writes";

export default async function BrandsAdminPage() {
  await connection();
  const brands = await listPartBrands();
  return (
    <div className="grid gap-8">
      <div>
        <h1 className="font-display text-3xl font-semibold">Бренды запчастей</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Это производители деталей, не марки автомобилей.
        </p>
      </div>
      {brands.length === 0 ? (
        <EmptyState
          description="Бренд можно создать здесь или получить из колонки прайса при импорте."
          title="Брендов пока нет"
        />
      ) : (
        <ul className="grid gap-2">
          {brands.map((brand) => (
            <li
              className="rounded-control border border-line bg-surface px-4 py-3 text-sm"
              key={brand.id}
            >
              {brand.name}
              {!brand.isActive ? " · отключён" : ""}
            </li>
          ))}
        </ul>
      )}
      <form action="/api/admin/brands" className="grid max-w-xl gap-4" method="post">
        <Field htmlFor="brand-name" label="Название">
          <input className={controlClassName} id="brand-name" name="name" required />
        </Field>
        <button className={buttonClassName()} type="submit">
          Добавить
        </button>
      </form>
    </div>
  );
}
