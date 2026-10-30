import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_LABEL, PAYMENT_LABEL } from "@/lib/labels";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Заказ принят", robots: { index: false, follow: false } };

export default async function SuccessPage({ searchParams }: { searchParams: Promise<{ token?: string }> }) {
  const { token } = await searchParams;
  if (!token) notFound();
  const order = await prisma.order.findUnique({ where: { accessToken: token }, include: { items: true, deliveryMethod: true } });
  if (!order) notFound();
  return (
    <div className="page py-10">
      <h1 className="text-3xl font-semibold text-navy">Заказ {order.number} сохранён</h1>
      <p className="mt-3 max-w-2xl leading-7">Статус: {ORDER_STATUS_LABEL[order.status]}. Оплата: {PAYMENT_LABEL[order.paymentState]}. {order.paymentNote}</p>
      <p className="mt-2 max-w-2xl text-sm leading-6">{order.deliveryNote}</p>
      <p className="mt-2 text-sm">Письмо не отправлено: почтовый сервис не подключён. Сохраните номер заказа.</p>
      <ul className="mt-6 space-y-2 text-sm">
        {order.items.map((item) => (
          <li key={item.id}>{item.name} · {item.sku} · {item.quantity} × {formatMoney(item.unitPriceCents, item.currency)}</li>
        ))}
      </ul>
      <p className="mt-4 text-xl font-semibold">Итого {formatMoney(order.totalCents, order.currency)}</p>
      {order.discountCents > 0 && <p className="text-sm">Скидка {formatMoney(order.discountCents, order.currency)}</p>}
      <Link href="/catalog" className="btn-navy mt-6">В каталог</Link>
    </div>
  );
}
