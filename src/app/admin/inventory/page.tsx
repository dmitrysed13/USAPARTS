import { bulkStockAction, updateInventoryAction } from "@/server/actions/admin";
import { prisma } from "@/lib/db";
import { STOCK_LABEL, STOCK_STATUSES } from "@/lib/labels";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function InventoryAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("inventory.manage");
  const query = await searchParams;
  const products = await prisma.product.findMany({ orderBy: { sku: "asc" }, take: 80, include: { inventory: true } });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Остатки</h1>
      {query.saved && <p className="mt-2 text-sm text-ok">Обновлено: {query.saved}</p>}
      {query.error && <p className="mt-2 text-sm text-rose-700">Нужно подтверждение.</p>}
      <form action={bulkStockAction} className="card mt-4 grid gap-2 p-4 md:grid-cols-4">
        <input name="categorySlug" placeholder="slug категории или пусто" className="field" />
        <select name="stockStatus" className="field"><option value="">Не менять статус</option>{STOCK_STATUSES.map((status) => <option key={status} value={status}>{STOCK_LABEL[status]}</option>)}</select>
        <input name="quantity" placeholder="Количество" className="field" />
        <label className="text-sm"><input type="checkbox" name="confirm" /> Подтверждаю массовое изменение</label>
        <button className="btn-navy w-fit" type="submit">Применить</button>
      </form>
      <div className="mt-4 space-y-2">
        {products.map((product) => (
          <form key={product.id} action={updateInventoryAction} className="grid items-center gap-2 border-b border-line py-2 text-sm md:grid-cols-[1fr_120px_180px_auto]">
            <input type="hidden" name="productId" value={product.id} />
            <span>{product.sku} · {product.name}</span>
            <input name="quantity" type="number" min={0} defaultValue={product.quantity} className="field" />
            <select name="stockStatus" defaultValue={product.stockStatus} className="field">{STOCK_STATUSES.map((status) => <option key={status} value={status}>{STOCK_LABEL[status]}</option>)}</select>
            <button className="btn-ghost" type="submit">Сохранить</button>
          </form>
        ))}
      </div>
    </div>
  );
}
