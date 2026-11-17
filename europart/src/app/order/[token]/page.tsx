import { connection } from "next/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Container } from "@/components/ui/container";
import { closedMetadata } from "@/lib/seo/closed";
import { getOrderByAccessToken } from "@/modules/commerce/orders";
import { orderStatusLabels, type OrderStatusId } from "@/modules/commerce/order-status";
import { getPublicPaymentAvailability } from "@/modules/commerce/payment/service";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ token: string }>;
}): Promise<Metadata> {
  await connection();
  const { token } = await params;
  const order = await getOrderByAccessToken(token);
  if (!order) {
    return closedMetadata({ title: "Заказ", canonical: "/cart" });
  }
  return closedMetadata({
    title: `Заказ ${order.number}`,
    description: "Статус заказа EUROPART.",
    canonical: `/order/${token}`,
  });
}

export default async function OrderPage({
  params,
}: {
  params: Promise<{ token: string }>;
}) {
  await connection();
  const { token } = await params;
  const order = await getOrderByAccessToken(token);
  if (!order) {
    notFound();
  }
  const payment = await getPublicPaymentAvailability();

  return (
    <Container className="grid gap-8 py-10">
      <div>
        <p className="text-sm text-ink-muted">Заказ принят</p>
        <h1 className="mt-2 font-display text-3xl font-semibold">{order.number}</h1>
        <p className="mt-2 text-ink-muted">
          Статус: {orderStatusLabels[order.status as OrderStatusId]}
        </p>
      </div>
      <dl className="grid gap-3 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-muted">Получатель</dt>
          <dd className="font-medium">{order.customerName}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Оплата</dt>
          <dd className="font-medium">
            {order.checkoutMode === "ONLINE" ? "Онлайн" : "Через менеджера"} ·{" "}
            {order.paymentState}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Доставка</dt>
          <dd className="font-medium">
            {order.deliveryMethodRef?.name ?? order.deliveryMethod ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Сумма</dt>
          <dd className="font-medium">
            {(order.totalCents / 100).toFixed(2)} {order.currency.trim()}
          </dd>
        </div>
      </dl>
      {!order.deliveryCostConfirmedByManager || !order.deliveryEtaConfirmedByManager ? (
        <p className="rounded-md border border-line bg-surface-muted px-4 py-3 text-sm">
          Стоимость и/или срок доставки подтвердит менеджер. В заказ не подставляются
          выдуманные тарифы перевозчика.
        </p>
      ) : null}
      {order.checkoutMode === "ONLINE" && !payment.configured ? (
        <p className="rounded-md border border-line bg-surface-muted px-4 py-3 text-sm">
          Онлайн-оплата недоступна: {payment.message}
        </p>
      ) : null}
      {order.paymentNote ? (
        <p className="text-sm text-ink-muted">{order.paymentNote}</p>
      ) : null}
      <ul className="divide-y divide-line border border-line">
        {order.items.map((item) => (
          <li className="flex justify-between gap-4 px-4 py-3 text-sm" key={item.id}>
            <span>
              {item.name} × {item.quantity}
            </span>
            <span>
              {((item.unitPriceCents * item.quantity) / 100).toFixed(2)}{" "}
              {item.currency.trim()}
            </span>
          </li>
        ))}
      </ul>
      <Link className="text-brand" href="/catalog">
        Вернуться в каталог
      </Link>
    </Container>
  );
}
