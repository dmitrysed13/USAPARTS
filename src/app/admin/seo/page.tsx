import { saveLandingAction, saveTemplateAction } from "@/server/actions/admin";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function SeoAdmin() {
  await requirePermission("seo.write");
  const [templates, landings, counts] = await Promise.all([
    prisma.seoTemplate.findMany({ orderBy: { key: "asc" } }),
    prisma.landingPage.findMany({ orderBy: { slug: "asc" } }),
    prisma.product.count({ where: { isPublished: true, indexable: true } }),
  ]);
  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-navy">SEO</h1>
        <p className="mt-2 text-sm">Индексируемых товаров: {counts}. Карта сайта строится из опубликованных карточек и комбинаций, где эти карточки есть. Пустые фильтры в неё не попадают.</p>
      </div>
      <form action={saveTemplateAction} className="card grid gap-2 p-4">
        <h2 className="font-semibold">Шаблон</h2>
        <input name="key" placeholder="product, category, brand, model, year, fitment" className="field" required />
        <input name="titleTemplate" placeholder="Title, переменные {name} {sku} {oem}" className="field" required />
        <textarea name="descriptionTemplate" className="field" required />
        <button className="btn-navy w-fit">Сохранить шаблон</button>
      </form>
      <ul className="text-sm">{templates.map((template) => <li key={template.id} className="border-b border-line py-2"><strong>{template.key}</strong> · {template.titleTemplate}</li>)}</ul>
      <form action={saveLandingAction} className="card grid gap-2 p-4">
        <h2 className="font-semibold">Посадочная страница</h2>
        <input name="slug" placeholder="ford-mustang-2018-hood" className="field" required />
        <input name="h1" placeholder="H1" className="field" required />
        <input name="seoTitle" placeholder="Title" className="field" />
        <textarea name="seoDescription" placeholder="Description" className="field" />
        <textarea name="body" placeholder="Уникальный текст в markdown" className="field min-h-32" />
        <label className="text-sm"><input type="checkbox" name="isPublished" /> Опубликована</label>
        <label className="text-sm"><input type="checkbox" name="indexable" /> Индексировать</label>
        <button className="btn-navy w-fit">Сохранить посадочную</button>
      </form>
      <ul className="text-sm">{landings.map((landing) => <li key={landing.id} className="border-b border-line py-2">/{landing.slug} · {landing.indexable ? "index" : "noindex"} · {landing.isPublished ? "опубликована" : "черновик"}</li>)}</ul>
    </div>
  );
}
