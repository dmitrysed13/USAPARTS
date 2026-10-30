import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { prisma } from "@/lib/db";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const category = await prisma.articleCategory.findUnique({ where: { slug } });
  if (!category) return {};
  return { title: category.name, alternates: { canonical: `/blog/category/${slug}` } };
}

export default async function ArticleCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const category = await prisma.articleCategory.findUnique({
    where: { slug },
    include: { articles: { where: { isPublished: true }, orderBy: { publishedAt: "desc" } } },
  });
  if (!category) notFound();
  return (
    <div className="page py-8">
      <Breadcrumbs items={[{ name: "Главная", href: "/" }, { name: "Статьи", href: "/blog" }, { name: category.name }]} />
      <h1 className="text-3xl font-semibold text-navy">{category.name}</h1>
      <div className="mt-6 space-y-4">
        {category.articles.map((article) => (
          <article key={article.id} className="card p-5">
            <h2 className="text-xl font-semibold text-navy"><Link href={`/blog/${article.slug}`}>{article.title}</Link></h2>
            <p className="mt-2">{article.excerpt}</p>
          </article>
        ))}
      </div>
    </div>
  );
}
