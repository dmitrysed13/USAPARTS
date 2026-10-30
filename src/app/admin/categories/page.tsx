import { prisma } from "@/lib/db";
import { saveCategoryAction } from "@/server/actions/admin";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function CategoriesAdmin() {
  await requirePermission("catalog.write");
  const categories = await prisma.category.findMany({ orderBy: [{ parentId: "asc" }, { sortOrder: "asc" }], include: { parent: true } });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Категории</h1>
      <form action={saveCategoryAction} className="card mt-4 grid gap-2 p-4 md:grid-cols-2">
        <input name="name" required placeholder="Название" className="field" />
        <input name="slug" placeholder="slug" className="field" />
        <select name="parentId" className="field">
          <option value="">Корневая</option>
          {categories.filter((category) => !category.parentId).map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
        </select>
        <input name="seoTitle" placeholder="SEO title" className="field" />
        <textarea name="intro" placeholder="Текст" className="field md:col-span-2" />
        <textarea name="seoDescription" placeholder="SEO description" className="field md:col-span-2" />
        <button className="btn-navy w-fit" type="submit">Сохранить</button>
      </form>
      <ul className="mt-4 text-sm">
        {categories.map((category) => (
          <li key={category.id} className="border-b border-line py-2">{category.parent ? `${category.parent.name} / ` : ""}{category.name} · {category.slug}</li>
        ))}
      </ul>
    </div>
  );
}
