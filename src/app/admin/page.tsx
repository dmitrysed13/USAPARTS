import Link from "next/link";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_LABEL } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  await requirePermission("dashboard.view");
  const [products, orders, vin, customers, revenue, recent] = await Promise.all([
    prisma.product.count(),
    prisma.order.count(),
    prisma.vinRequest.count({ where: { status: "NEW" } }),
    prisma.customer.count(),
    prisma.order.aggregate({ _sum: { totalCents: true }, where: { status: { not: "CANCELLED" } } }),
    prisma.order.findMany({ orderBy: { createdAt: "desc" }, take: 6, include: { customer: true } }),
  ]);
  const byStatus = await prisma.order.groupBy({ by: ["status"], _count: { _all: true } });
  const max = Math.max(1, ...byStatus.map((row) => row._count._all));
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Сводка</h1>
      <p className="mt-2 text-sm text-slate-600">Цифры посчитаны по базе. Сумма включает тестовые заказы, если они есть.</p>
      <div className="mt-5 grid gap-3 sm:grid-cols-4">
        {[
          ["Товары", products],
          ["Заказы", orders],
          ["Новые VIN", vin],
          ["Клиенты", customers],
        ].map(([label, value]) => (
          <article key={String(label)} className="card p-4">
            <p className="text-sm text-slate-500">{label}</p>
            <p className="text-2xl font-semibold text-navy">{value}</p>
          </article>
        ))}
      </div>
      <p className="mt-4 text-sm">Сумма неотменённых заказов: {formatMoney(revenue._sum.totalCents ?? 0)}</p>
      <div className="mt-6 space-y-2">
        {byStatus.map((row) => (
          <div key={row.status} className="grid grid-cols-[160px_1fr_40px] items-center gap-2 text-sm">
            <span>{ORDER_STATUS_LABEL[row.status]}</span>
            <span className="h-2 rounded bg-navy" style={{ width: `${(row._count._all / max) * 100}%` }} />
            <span>{row._count._all}</span>
          </div>
        ))}
      </div>
      <h2 className="mt-8 font-semibold text-navy">Последние заказы</h2>
      <ul className="mt-2 text-sm">
        {recent.map((order) => (
          <li key={order.id}>
            <Link className="text-navy underline" href={`/admin/orders/${order.id}`}>{order.number}</Link> · {order.customer.name} · {ORDER_STATUS_LABEL[order.status]}
          </li>
        ))}
      </ul>
    </div>
  );
}
