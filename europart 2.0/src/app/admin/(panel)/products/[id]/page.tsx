import { notFound } from "next/navigation";
import { connection } from "next/server";
import { ProductForm } from "@/components/admin/product-form";
import { buttonClassName } from "@/components/ui/button";
import { Field, controlClassName } from "@/components/ui/field";
import {
  getAdminProduct,
  listCategories,
  listPartBrands,
} from "@/modules/admin/catalog-writes";
import { listSuppliers } from "@/modules/admin/suppliers";
import { listWarehouses } from "@/modules/admin/warehouses";

const availability = [
  ["UNKNOWN", "Не подтверждено"],
  ["IN_STOCK", "В наличии"],
  ["LOW_STOCK", "Мало"],
  ["ON_ORDER", "Под заказ"],
  ["INCOMING", "Ожидается"],
  ["OUT_OF_STOCK", "Нет"],
  ["DISCONTINUED", "Снят"],
] as const;

function money(value: { toFixed(digits: number): string } | null): string {
  return value ? value.toFixed(2) : "—";
}

export default async function EditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  const { id } = await params;
  const [product, categories, brands, suppliers, warehouses] = await Promise.all([
    getAdminProduct(id),
    listCategories(),
    listPartBrands(),
    listSuppliers(),
    listWarehouses(),
  ]);
  if (!product) {
    notFound();
  }
  return (
    <div className="grid gap-10">
      <div className="grid max-w-xl gap-6">
        <h1 className="font-display text-3xl font-semibold">{product.name}</h1>
        <ProductForm
          action={`/api/admin/products/${product.id}`}
          brands={brands}
          categories={categories}
          product={product}
        />
        <form action={`/api/admin/products/${product.id}`} method="post">
          <input name="intent" type="hidden" value="archive" />
          <button className={buttonClassName("secondary")} type="submit">
            Скрыть из каталога
          </button>
        </form>
      </div>
      <section className="grid gap-4">
        <h2 className="font-display text-xl font-semibold">Предложения</h2>
        <p className="text-sm text-ink-muted">
          Закупка и поставщик видны только здесь. В публичной карточке остаётся розничная
          цена.
        </p>
        {product.offers.length === 0 ? (
          <p className="text-sm text-ink-muted">Предложений пока нет.</p>
        ) : (
          <ul className="grid gap-3">
            {product.offers.map((offer) => (
              <li
                className="rounded-2xl border border-line bg-surface p-4 text-sm"
                key={offer.id}
              >
                <p className="font-semibold">
                  {offer.sourceType === "OWN_STOCK"
                    ? "Свой склад"
                    : offer.supplier?.name || "Поставщик"}
                  {offer.warehouse ? ` · ${offer.warehouse.name}` : ""}
                </p>
                <p className="mt-1 text-ink-muted">
                  Закупка {money(offer.purchasePrice)} {offer.currency.trim()} · Розница{" "}
                  {money(offer.retailPrice)} · Опт {money(offer.b2bPrice)} · Количество{" "}
                  {offer.quantity} · Резерв {offer.reservedQuantity} ·{" "}
                  {offer.availabilityStatus}
                </p>
              </li>
            ))}
          </ul>
        )}
        <form action="/api/admin/offers" className="grid max-w-xl gap-4" method="post">
          <input name="productId" type="hidden" value={product.id} />
          <h3 className="font-semibold">Добавить предложение</h3>
          <Field htmlFor="offer-source" label="Источник">
            <select
              className={controlClassName}
              defaultValue="SUPPLIER"
              id="offer-source"
              name="sourceType"
            >
              <option value="SUPPLIER">Поставщик</option>
              <option value="OWN_STOCK">Свой склад</option>
            </select>
          </Field>
          <Field htmlFor="offer-supplier" label="Поставщик">
            <select
              className={controlClassName}
              defaultValue=""
              id="offer-supplier"
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
          <Field htmlFor="offer-warehouse" label="Склад">
            <select
              className={controlClassName}
              defaultValue=""
              id="offer-warehouse"
              name="warehouseId"
            >
              <option value="">Не выбран</option>
              {warehouses.map((warehouse) => (
                <option key={warehouse.id} value={warehouse.id}>
                  {warehouse.name}
                </option>
              ))}
            </select>
          </Field>
          <Field htmlFor="offer-purchase" label="Закупка">
            <input
              className={controlClassName}
              id="offer-purchase"
              name="purchasePrice"
            />
          </Field>
          <Field htmlFor="offer-retail" label="Розница">
            <input className={controlClassName} id="offer-retail" name="retailPrice" />
          </Field>
          <Field htmlFor="offer-b2b" label="Оптовая цена">
            <input className={controlClassName} id="offer-b2b" name="b2bPrice" />
          </Field>
          <Field htmlFor="offer-currency" label="Валюта">
            <input
              className={controlClassName}
              defaultValue="BYN"
              id="offer-currency"
              name="currency"
            />
          </Field>
          <Field htmlFor="offer-quantity" label="Количество">
            <input
              className={controlClassName}
              defaultValue="0"
              id="offer-quantity"
              name="quantity"
            />
          </Field>
          <Field htmlFor="offer-availability" label="Наличие">
            <select
              className={controlClassName}
              defaultValue="UNKNOWN"
              id="offer-availability"
              name="availabilityStatus"
            >
              {availability.map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </select>
          </Field>
          <Field htmlFor="offer-lead" label="Срок, дни">
            <input className={controlClassName} id="offer-lead" name="leadTime" />
          </Field>
          <button className={buttonClassName()} type="submit">
            Добавить предложение
          </button>
        </form>
      </section>
    </div>
  );
}
