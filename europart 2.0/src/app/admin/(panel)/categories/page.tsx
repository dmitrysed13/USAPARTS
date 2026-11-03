import { connection } from "next/server";
import { buttonClassName } from "@/components/ui/button";
import { Field, controlClassName } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/state";
import { listCategories } from "@/modules/admin/catalog-writes";

export default async function CategoriesAdminPage() {
  await connection();
  const categories = await listCategories();
  return (
    <div className="grid gap-8">
      <h1 className="font-display text-3xl font-semibold">Категории</h1>
      {categories.length === 0 ? (
        <EmptyState
          description="Категория нужна, чтобы создать карточку товара."
          title="Категорий пока нет"
        />
      ) : (
        <ul className="grid gap-2">
          {categories.map((category) => (
            <li
              className="rounded-control border border-line bg-surface px-4 py-3 text-sm"
              key={category.id}
            >
              <span className="font-semibold">{category.name}</span>
              <span className="text-ink-muted"> · {category.slug}</span>
              {category.parent ? (
                <span className="text-ink-muted"> · внутри «{category.parent.name}»</span>
              ) : null}
            </li>
          ))}
        </ul>
      )}
      <form action="/api/admin/categories" className="grid max-w-xl gap-4" method="post">
        <h2 className="font-display text-xl font-semibold">Новая категория</h2>
        <Field htmlFor="category-name" label="Название">
          <input className={controlClassName} id="category-name" name="name" required />
        </Field>
        <Field htmlFor="category-parent" label="Родитель">
          <select
            className={controlClassName}
            defaultValue=""
            id="category-parent"
            name="parentId"
          >
            <option value="">Без родителя</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </Field>
        <button className={buttonClassName()} type="submit">
          Добавить
        </button>
      </form>
    </div>
  );
}
