import { notFound } from "next/navigation";
import { updateOrderStatusAction } from "@/server/actions/admin";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_LABEL, ORDER_STATUSES, PAYMENT_LABEL } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function OrderAdminPage({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("orders.manage");
  const { id } = await params;
  const order = await prisma.order.findUnique({ where: { id }, include: { items: true, customer: true, deliveryMethod: true } });
  if (!order) notFound();
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">{order.number}</h1>
      <p className="mt-2 text-sm">{order.customer.name} · {order.customer.phone} · {order.customer.email}</p>
      <p className="text-sm">{PAYMENT_LABEL[order.paymentState]}. {order.paymentNote}</p>
      <p className="text-sm">{order.deliveryNote}</p>
      <ul className="mt-4 text-sm">{order.items.map((item) => <li key={item.id}>{item.sku} · {item.name} × {item.quantity} · {formatMoney(item.unitPriceCents, item.currency)}</li>)}</ul>
      <p className="mt-3 font-semibold">Итого {formatMoney(order.totalCents, order.currency)}</p>
      <form action={updateOrderStatusAction} className="mt-4 flex gap-2">
        <input type="hidden" name="id" value={order.id} />
        <select name="status" defaultValue={order.status} className="field max-w-xs">
          {ORDER_STATUSES.map((status) => <option key={status} value={status}>{ORDER_STATUS_LABEL[status]}</option>)}
        </select>
        <button className="btn-navy" type="submit">Сменить статус</button>
      </form>
    </div>
  );
}
