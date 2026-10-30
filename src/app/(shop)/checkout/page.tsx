import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { Notice } from "@/components/notice";
import { submitCheckout } from "@/server/actions/store";
import { readCart } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { getSettings } from "@/lib/site";

export const metadata: Metadata = { title: "Оформление заказа", robots: { index: false, follow: false } };

export default async function CheckoutPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  const lines = await readCart();
  if (!lines.length) redirect("/cart");
  const [products, methods, settings] = await Promise.all([
    prisma.product.findMany({ where: { id: { in: lines.map((line) => line.productId) }, isPublished: true } }),
    prisma.deliveryMethod.findMany({ where: { isActive: true }, orderBy: { name: "asc" } }),
    getSettings(),
  ]);
  const byId = new Map(products.map((product) => [product.id, product]));
  const rows = lines.map((line) => ({ line, product: byId.get(line.productId) })).filter((row) => row.product?.priceCents != null);
  const subtotal = rows.reduce((sum, row) => sum + row.product!.priceCents! * row.line.quantity, 0);
  return (
    <div className="page grid gap-8 py-8 lg:grid-cols-[1fr_.8fr]">
      <form action={submitCheckout} className="card space-y-3 p-5">
        <h1 className="text-3xl font-semibold text-navy">Оформление заказа</h1>
        <Notice error={query.error} />
        <p className="text-sm leading-6">Онлайн-оплата не проводится, если провайдер не подключён. Заказ сохранится со статусом «Новый».</p>
        <label className="block text-sm">Имя<input name="name" required className="field mt-1" /></label>
        <label className="block text-sm">Email<input name="email" type="email" required className="field mt-1" /></label>
        <label className="block text-sm">Телефон<input name="phone" required className="field mt-1" /></label>
        <label className="block text-sm">Адрес доставки<textarea name="address" className="field mt-1 min-h-20" /></label>
        <label className="block text-sm">Комментарий<textarea name="comment" className="field mt-1 min-h-20" /></label>
        <fieldset>
          <legend className="text-sm font-semibold">Доставка</legend>
          <div className="mt-2 space-y-2">
            {methods.map((method) => (
              <label key={method.id} className="flex gap-2 text-sm">
                <input type="radio" name="deliveryMethodId" value={method.id} required />
                <span>
                  {method.name}
                  <span className="block text-slate-500">{method.description} {method.priceCents == null ? "Стоимость не задана." : formatMoney(method.priceCents)}</span>
                </span>
              </label>
            ))}
          </div>
        </fieldset>
        <label className="block text-sm">Промокод
          <input name="couponCode" className="field mt-1" />
          {settings.demoMode && <span className="mt-1 block text-xs text-slate-500">Для проверки расчёта в демо-базе есть код TEST10, скидка 10%.</span>}
        </label>
        <button className="btn-cta" type="submit">Подтвердить заказ</button>
      </form>
      <aside className="card h-fit p-5">
        <h2 className="font-semibold text-navy">Состав</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {rows.map(({ line, product }) => (
            <li key={product!.id} className="flex justify-between gap-3">
              <Link href={`/product/${product!.slug}`}>{product!.name} × {line.quantity}</Link>
              <span>{formatMoney(product!.priceCents! * line.quantity, product!.currency)}</span>
            </li>
          ))}
        </ul>
        <p className="mt-4 font-semibold">Товары: {formatMoney(subtotal)}</p>
        <p className="mt-2 text-xs text-slate-500">Итог с промокодом и доставкой будет посчитан на сервере из цен базы.</p>
      </aside>
    </div>
  );
}
