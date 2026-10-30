import { prisma } from "@/lib/db";
import { saveMakeAction } from "@/server/actions/admin";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function MakesAdmin() {
  await requirePermission("catalog.write");
  const makes = await prisma.vehicleMake.findMany({ orderBy: { name: "asc" } });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Марки</h1>
      <form action={saveMakeAction} className="card mt-4 grid gap-2 p-4 md:grid-cols-2">
        <input name="name" required placeholder="Название" className="field" />
        <input name="slug" placeholder="slug" className="field" />
        <input name="country" placeholder="Страна марки" className="field" defaultValue="USA" />
        <select name="isActive" className="field" defaultValue="true"><option value="true">Активна</option><option value="false">Скрыта</option></select>
        <label className="text-sm"><input type="checkbox" name="isFeatured" /> Популярная</label>
        <textarea name="intro" placeholder="Уникальный текст марки" className="field md:col-span-2" />
        <input name="seoTitle" placeholder="SEO title" className="field" />
        <input name="seoDescription" placeholder="SEO description" className="field" />
        <button className="btn-navy w-fit" type="submit">Сохранить</button>
      </form>
      <ul className="mt-4 text-sm">{makes.map((make) => <li key={make.id} className="border-b border-line py-2">{make.name} · {make.slug} · {make.country}</li>)}</ul>
    </div>
  );
}
