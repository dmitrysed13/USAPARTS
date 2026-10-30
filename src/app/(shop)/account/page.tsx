import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { logoutAction } from "@/server/actions/auth";
import { prisma } from "@/lib/db";
import { ORDER_STATUS_LABEL, ROLE_LABEL } from "@/lib/labels";
import { formatMoney } from "@/lib/money";

export const metadata: Metadata = { title: "Кабинет", robots: { index: false, follow: false } };

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/account");
  const orders = await prisma.order.findMany({
    where: { userId: session.user.id },
    orderBy: { createdAt: "desc" },
    include: { items: true },
  });
  return (
    <div className="page py-8">
      <h1 className="text-3xl font-semibold text-navy">Кабинет</h1>
      <p className="mt-2">{session.user.name} · {session.user.email} · {ROLE_LABEL[session.user.role]}</p>
      <div className="mt-4 flex gap-3">
        {(session.user.role === "ADMIN" || session.user.role === "MANAGER" || session.user.role === "CONTENT") && (
          <Link className="btn-navy" href="/admin">Админка</Link>
        )}
        <form action={logoutAction}><button className="btn-ghost" type="submit">Выйти</button></form>
      </div>
      <h2 className="mt-8 text-xl font-semibold text-navy">Заказы</h2>
      <div className="mt-4 space-y-3">
        {orders.map((order) => (
          <article key={order.id} className="card p-4 text-sm">
            <p className="font-semibold">{order.number} · {ORDER_STATUS_LABEL[order.status]} · {formatMoney(order.totalCents, order.currency)}</p>
            <ul className="mt-2">{order.items.map((item) => <li key={item.id}>{item.name} × {item.quantity}</li>)}</ul>
          </article>
        ))}
        {!orders.length && <p>Заказов, привязанных к этому аккаунту, нет.</p>}
      </div>
    </div>
  );
}
