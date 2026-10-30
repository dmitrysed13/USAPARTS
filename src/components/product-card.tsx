import Link from "next/link";
import { addToCart } from "@/server/actions/cart";
import { canPurchase, type ProductCard } from "@/lib/dto";
import { CONDITION_LABEL, STOCK_LABEL } from "@/lib/labels";
import { formatMoney } from "@/lib/money";

const STOCK_CLASS: Record<string, string> = {
  IN_STOCK: "bg-emerald-50 text-ok",
  US_WAREHOUSE: "bg-sky-50 text-sky-900",
  IN_TRANSIT: "bg-amber-50 text-amber-900",
  ON_ORDER: "bg-slate-100 text-graphite",
  OUT_OF_STOCK: "bg-rose-50 text-rose-800",
};

export function ProductCardView({ product }: { product: ProductCard }) {
  const purchasable = canPurchase(product);
  return (
    <article className="card grid gap-4 p-4 sm:grid-cols-[96px_1fr_auto] sm:items-center">
      <Link href={`/product/${product.slug}`} className="block overflow-hidden rounded-md bg-mist">
        {product.image ? (
          <img
            src={`/api/media/${product.image.id}`}
            alt={product.image.alt}
            width={product.image.width}
            height={product.image.height}
            loading="lazy"
            decoding="async"
            className="aspect-[4/3] h-auto w-full object-cover"
          />
        ) : (
          <span className="flex aspect-[4/3] items-center justify-center text-xs text-slate-500">Нет изображения</span>
        )}
      </Link>
      <div>
        <div className="mb-2 flex flex-wrap gap-2">
          <span className={`rounded px-2 py-0.5 text-xs font-medium ${STOCK_CLASS[product.stockStatus] ?? "bg-slate-100"}`}>
            {STOCK_LABEL[product.stockStatus]}
          </span>
          <span className="rounded bg-mist px-2 py-0.5 text-xs">{CONDITION_LABEL[product.condition]}</span>
          {product.isDemo && <span className="rounded border border-amber-300 px-2 py-0.5 text-xs text-amber-800">Тестовая позиция</span>}
        </div>
        <h3 className="text-base font-semibold text-navy">
          <Link href={`/product/${product.slug}`}>{product.name}</Link>
        </h3>
        <p className="mt-1 text-sm text-slate-500">
          Артикул {product.sku}
          {product.oem ? ` · OEM ${product.oem}` : ""}
        </p>
        {product.fitment && <p className="text-sm text-graphite">Совместимость: {product.fitment}</p>}
        <p className="text-sm text-slate-500">В базе: {product.quantity} шт.</p>
      </div>
      <div className="flex flex-col items-start gap-2 sm:items-end">
        <p className="text-lg font-semibold text-navy">{formatMoney(product.priceCents, product.currency)}</p>
        {product.isDemo && product.priceCents != null && <p className="text-xs text-amber-800">Тестовая цена</p>}
        {purchasable ? (
          <form action={addToCart}>
            <input type="hidden" name="productId" value={product.id} />
            <input type="hidden" name="quantity" value="1" />
            <button className="btn-cta" type="submit">
              Купить
            </button>
          </form>
        ) : (
          <Link className="btn-ghost" href={`/product/${product.slug}`}>
            Запросить
          </Link>
        )}
      </div>
    </article>
  );
}

export function ProductList({ products }: { products: ProductCard[] }) {
  if (!products.length) {
    return (
      <p className="card p-6 text-sm leading-6">
        В этой выборке нет опубликованных товаров. Оставьте заявку на подбор — позиция не обязана быть в каталоге.
      </p>
    );
  }
  return (
    <div className="space-y-3">
      {products.map((product) => (
        <ProductCardView key={product.id} product={product} />
      ))}
    </div>
  );
}
