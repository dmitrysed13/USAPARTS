import { prisma } from "@/lib/db";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function CustomersAdmin({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("customers.view");
  const { q } = await searchParams;
  const customers = await prisma.customer.findMany({
    where: q ? { OR: [{ email: { contains: q, mode: "insensitive" } }, { phone: { contains: q } }, { name: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { createdAt: "desc" },
    take: 100,
  });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Клиенты</h1>
      <form className="mt-3 flex gap-2"><input name="q" defaultValue={q} className="field max-w-sm" placeholder="Имя, телефон, email" /><button className="btn-ghost">Найти</button></form>
      <ul className="mt-4 text-sm">{customers.map((customer) => <li key={customer.id} className="border-b border-line py-2">{customer.name} · {customer.phone} · {customer.email}</li>)}</ul>
    </div>
  );
}
