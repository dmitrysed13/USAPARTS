import type { Metadata } from "next";
import Link from "next/link";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { prisma } from "@/lib/db";

export const revalidate = 300;

export const metadata: Metadata = {
  title: "Статьи об автозапчастях",
  description: "Как заказать запчасти из США, читать VIN и OEM, отличать новую деталь от контрактной.",
  alternates: { canonical: "/blog" },
};

export default async function BlogPage() {
  const [articles, categories] = await Promise.all([
    prisma.article.findMany({ where: { isPublished: true }, orderBy: { publishedAt: "desc" }, include: { category: true } }),
    prisma.articleCategory.findMany({ orderBy: { name: "asc" } }),
  ]);
  return (
    <div className="page py-8">
      <Breadcrumbs items={[{ name: "Главная", href: "/" }, { name: "Статьи" }]} />
      <h1 className="text-3xl font-semibold text-navy">Статьи</h1>
      <ul className="mt-4 flex flex-wrap gap-2">
        {categories.map((category) => (
          <li key={category.id}><Link className="btn-ghost" href={`/blog/category/${category.slug}`}>{category.name}</Link></li>
        ))}
      </ul>
      <div className="mt-6 grid gap-4">
        {articles.map((article) => (
          <article key={article.id} className="card p-5">
            <p className="text-xs text-slate-500">{article.category?.name}</p>
            <h2 className="mt-1 text-xl font-semibold text-navy"><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2>
            <p className="mt-2 leading-7">{article.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
