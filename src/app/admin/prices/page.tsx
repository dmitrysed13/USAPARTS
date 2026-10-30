import { bulkPriceAction, setPriceAction } from "@/server/actions/admin";
import { prisma } from "@/lib/db";
import { centsToInput } from "@/lib/money";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function PricesAdmin({ searchParams }: { searchParams: Promise<{ saved?: string; error?: string }> }) {
  await requirePermission("products.price");
  const query = await searchParams;
  const products = await prisma.product.findMany({ orderBy: { sku: "asc" }, take: 80 });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Цены</h1>
      {query.saved && <p className="mt-2 text-sm text-ok">Готово: {query.saved}</p>}
      {query.error && <p className="mt-2 text-sm text-rose-700">Проверьте подтверждение и число.</p>}
      <form action={bulkPriceAction} className="card mt-4 grid gap-2 p-4 md:grid-cols-4">
        <input name="categorySlug" placeholder="slug категории или пусто для всех" className="field" />
        <select name="mode" className="field"><option value="percent">Процент к текущей цене</option><option value="set">Задать цену, USD</option></select>
        <input name="amount" required placeholder="10 или -5" className="field" />
        <label className="text-sm"><input type="checkbox" name="confirm" /> Подтверждаю изменение цен в базе</label>
        <button className="btn-navy w-fit" type="submit">Изменить</button>
      </form>
      <div className="mt-4 space-y-2">
        {products.map((product) => (
          <form key={product.id} action={setPriceAction} className="grid items-center gap-2 border-b border-line py-2 text-sm md:grid-cols-[1fr_140px_auto]">
            <input type="hidden" name="id" value={product.id} />
            <span>{product.sku}</span>
            <input name="price" defaultValue={centsToInput(product.priceCents)} placeholder="пусто = нет цены" className="field" />
            <button className="btn-ghost" type="submit">Сохранить</button>
          </form>
        ))}
      </div>
    </div>
  );
}
