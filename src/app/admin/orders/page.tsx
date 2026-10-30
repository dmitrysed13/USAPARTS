import Link from "next/link";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_LABEL } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function OrdersAdmin({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  await requirePermission("orders.manage");
  const { status } = await searchParams;
  const orders = await prisma.order.findMany({
    where: status ? { status: status as never } : {},
    orderBy: { createdAt: "desc" },
    include: { customer: true },
    take: 100,
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Заказы</h1>
      <form className="mt-3">
        <select name="status" defaultValue={status ?? ""} className="field max-w-xs">
          <option value="">Все</option>
          {Object.entries(ORDER_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
        </select>
        <button className="btn-ghost ml-2" type="submit">Фильтр</button>
      </form>
      <table className="mt-4 w-full text-sm">
        <tbody>
          {orders.map((order) => (
            <tr key={order.id} className="border-b border-line">
              <td className="py-2"><Link className="text-navy underline" href={`/admin/orders/${order.id}`}>{order.number}</Link></td>
              <td>{order.customer.name}</td>
              <td>{ORDER_STATUS_LABEL[order.status]}</td>
              <td>{formatMoney(order.totalCents, order.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
