import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/notice";
import { removeFromCart, updateCart } from "@/server/actions/cart";
import { readCart } from "@/lib/cart";
import { canPurchase } from "@/lib/dto";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Корзина", robots: { index: false, follow: false } };

export default async function CartPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const lines = await readCart();
  const products = lines.length
    ? await prisma.product.findMany({ where: { id: { in: lines.map((line) => line.productId) }, isPublished: true } })
    : [];
  const byId = new Map(products.map((product) => [product.id, product]));
  const rows = lines
    .map((line) => ({ line, product: byId.get(line.productId) }))
    .filter((row) => row.product);
  const total = rows.reduce((sum, row) => sum + (row.product!.priceCents ?? 0) * row.line.quantity, 0);
  return (
    <div className="page py-8">
      <h1 className="text-3xl font-semibold text-navy">Корзина</h1>
      <Notice error={query.error} />
      {!rows.length && <p className="mt-6">Корзина пуста. <Link className="text-navy underline" href="/catalog">Перейти в каталог</Link></p>}
      <div className="mt-6 space-y-4">
        {rows.map(({ line, product }) => (
          <article key={product!.id} className="card flex flex-wrap items-center justify-between gap-4 p-4">
            <div>
              <h2 className="font-semibold text-navy"><Link href={`/product/${product!.slug}`}>{product!.name}</Link></h2>
              <p className="text-sm text-slate-500">{product!.sku} · {formatMoney(product!.priceCents, product!.currency)} · в базе {product!.quantity}</p>
              {!canPurchase(product!) && <p className="text-sm text-rose-700">Сейчас эту позицию нельзя оформить: нет цены или нет остатка.</p>}
            </div>
            <form action={updateCart} className="flex items-center gap-2">
              <input type="hidden" name="productId" value={product!.id} />
              <input name="quantity" type="number" min={0} max={99} defaultValue={line.quantity} className="field w-20" />
              <button className="btn-ghost" type="submit">Обновить</button>
            </form>
            <form action={removeFromCart}>
              <input type="hidden" name="productId" value={product!.id} />
              <button className="text-sm text-rose-700" type="submit">Удалить</button>
            </form>
          </article>
        ))}
      </div>
      {rows.length > 0 && (
        <div className="mt-6 flex items-center justify-between">
          <p className="text-xl font-semibold">Сумма товаров: {formatMoney(total)}</p>
          <Link href="/checkout" className="btn-cta">Оформить заказ</Link>
        </div>
      )}
      <p className="mt-4 text-sm text-slate-500">Доставка в сумму не включена, пока для выбранного способа нет тарифа.</p>
    </div>
  );
}
