import { notFound } from "next/navigation";
import { saveArticleAction } from "@/server/actions/admin";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function EditArticleAdmin({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("articles.write");
  const { id } = await params;
  const [article, categories] = await Promise.all([
    id === "new" ? null : prisma.article.findUnique({ where: { id } }),
    prisma.articleCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  if (id !== "new" && !article) notFound();
  return (
    <form action={saveArticleAction} className="grid max-w-3xl gap-3">
      <h1 className="text-2xl font-semibold text-navy">{article?.title ?? "Новая статья"}</h1>
      {article && <input type="hidden" name="id" value={article.id} />}
      <input name="title" required defaultValue={article?.title} className="field" />
      <input name="slug" defaultValue={article?.slug} className="field" />
      <select name="categoryId" defaultValue={article?.categoryId ?? ""} className="field">
        <option value="">Без категории</option>
        {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
      </select>
      <textarea name="excerpt" defaultValue={article?.excerpt} className="field" />
      <input name="seoTitle" defaultValue={article?.seoTitle ?? ""} className="field" />
      <textarea name="seoDescription" defaultValue={article?.seoDescription ?? ""} className="field" />
      <textarea name="body" defaultValue={article?.body} className="field min-h-72" />
      <label className="text-sm"><input type="checkbox" name="isPublished" defaultChecked={article?.isPublished} /> Опубликована</label>
      <button className="btn-navy w-fit">Сохранить</button>
    </form>
  );
}
