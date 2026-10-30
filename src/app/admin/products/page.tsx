import Link from "next/link";
import { prisma } from "@/lib/db";
import { formatMoney } from "@/lib/money";
import { STOCK_LABEL } from "@/lib/labels";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function ProductsAdminPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  await requirePermission("products.write");
  const { q } = await searchParams;
  const products = await prisma.product.findMany({
    where: q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }] } : {},
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: { category: true },
  });
  return (
    <div>
      <div className="flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold text-navy">Товары</h1>
        <Link className="btn-navy" href="/admin/products/new">Новый товар</Link>
      </div>
      <form className="mt-4 flex gap-2">
        <input name="q" defaultValue={q} placeholder="Артикул или название" className="field max-w-sm" />
        <button className="btn-ghost" type="submit">Найти</button>
      </form>
      <table className="mt-4 w-full text-sm">
        <thead><tr className="border-b text-left"><th className="py-2">SKU</th><th>Название</th><th>Цена</th><th>Статус</th><th>Кол-во</th></tr></thead>
        <tbody>
          {products.map((product) => (
            <tr key={product.id} className="border-b border-line">
              <td className="py-2">{product.sku}</td>
              <td><Link className="text-navy underline" href={`/admin/products/${product.id}`}>{product.name}</Link></td>
              <td>{formatMoney(product.priceCents, product.currency)}</td>
              <td>{STOCK_LABEL[product.stockStatus]}</td>
              <td>{product.quantity}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
