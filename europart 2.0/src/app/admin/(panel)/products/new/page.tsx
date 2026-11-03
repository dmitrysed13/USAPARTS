import { connection } from "next/server";
import { ProductForm } from "@/components/admin/product-form";
import { listCategories, listPartBrands } from "@/modules/admin/catalog-writes";

export default async function NewProductPage() {
  await connection();
  const [categories, brands] = await Promise.all([listCategories(), listPartBrands()]);
  return (
    <div className="grid max-w-xl gap-6">
      <h1 className="font-display text-3xl font-semibold">Новый товар</h1>
      <p className="text-sm text-ink-muted">
        По умолчанию карточка — черновик и не видна в каталоге.
      </p>
      <ProductForm action="/api/admin/products" brands={brands} categories={categories} />
    </div>
  );
}
