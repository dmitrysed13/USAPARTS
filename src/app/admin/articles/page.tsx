import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function ArticlesAdmin() {
  await requirePermission("articles.write");
  const articles = await prisma.article.findMany({ orderBy: { updatedAt: "desc" } });
  return (
    <div>
      <div className="flex justify-between"><h1 className="text-2xl font-semibold text-navy">Статьи</h1><Link className="btn-navy" href="/admin/articles/new">Новая</Link></div>
      <ul className="mt-4 text-sm">{articles.map((article) => <li key={article.id} className="border-b border-line py-2"><Link className="text-navy underline" href={`/admin/articles/${article.id}`}>{article.title}</Link> · {article.isPublished ? "опубликована" : "черновик"}</li>)}</ul>
    </div>
  );
}
