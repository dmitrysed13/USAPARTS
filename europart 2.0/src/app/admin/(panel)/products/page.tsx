import Link from "next/link";
import { connection } from "next/server";
import { buttonClassName } from "@/components/ui/button";
import { Field, controlClassName } from "@/components/ui/field";
import { EmptyState } from "@/components/ui/state";
import { listAdminProducts } from "@/modules/admin/catalog-writes";

const statusLabel = { DRAFT: "черновик", PUBLISHED: "опубликован", ARCHIVED: "скрыт" };

export default async function ProductsAdminPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  await connection();
  const { q = "" } = await searchParams;
  const products = await listAdminProducts(q);
  return (
    <div className="grid gap-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="font-display text-3xl font-semibold">Товары</h1>
        <Link className={buttonClassName()} href="/admin/products/new">
          Создать
        </Link>
      </div>
      <form className="flex flex-wrap gap-3" method="get">
        <Field htmlFor="product-q" label="Поиск по названию или артикулу">
          <input className={controlClassName} defaultValue={q} id="product-q" name="q" />
        </Field>
        <button className={`${buttonClassName("secondary")} self-end`} type="submit">
          Найти
        </button>
      </form>
      {products.length === 0 ? (
        <EmptyState
          description="Карточки появляются после ручного создания или применения прайса."
          title="Товаров нет"
        />
      ) : (
        <ul className="grid gap-2">
          {products.map((product) => (
            <li key={product.id}>
              <Link
                className="block rounded-2xl border border-line bg-surface p-4 hover:border-brand"
                href={`/admin/products/${product.id}`}
              >
                <span className="font-semibold">{product.name}</span>
                <span className="mt-1 block text-sm text-ink-muted">
                  {product.article || "без артикула"} · {product.category.name} ·{" "}
                  {statusLabel[product.status]}
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
