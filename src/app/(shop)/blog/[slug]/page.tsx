import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { prisma } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const article = await prisma.article.findFirst({ where: { slug, isPublished: true } });
  if (!article) return {};
  return {
    title: article.seoTitle || article.title,
    description: article.seoDescription || article.excerpt,
    alternates: { canonical: `/blog/${article.slug}` },
    openGraph: { type: "article", title: article.seoTitle || article.title, description: article.seoDescription || article.excerpt },
  };
}

export default async function ArticlePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const article = await prisma.article.findFirst({
    where: { slug, isPublished: true },
    include: { category: true, faqs: { orderBy: { sortOrder: "asc" } }, author: { select: { name: true } } },
  });
  if (!article) notFound();
  const schema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: article.title,
    description: article.excerpt,
    datePublished: article.publishedAt?.toISOString(),
    dateModified: article.updatedAt.toISOString(),
    author: { "@type": "Person", name: article.author?.name || "USAPARTS" },
    mainEntityOfPage: absoluteUrl(`/blog/${article.slug}`),
  };
  return (
    <article className="page py-8">
      <Breadcrumbs items={[{ name: "Главная", href: "/" }, { name: "Статьи", href: "/blog" }, { name: article.title }]} />
      <JsonLd data={schema} />
      <p className="text-sm text-slate-500">{article.category?.name}</p>
      <h1 className="mt-2 max-w-3xl text-3xl font-semibold text-navy">{article.title}</h1>
      <p className="mt-3 max-w-3xl text-lg leading-8">{article.excerpt}</p>
      <div className="prose-us mt-6 max-w-3xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(article.body) }} />
      {article.faqs.length > 0 && (
        <section className="mt-8 max-w-3xl">
          <h2 className="text-2xl font-semibold text-navy">Вопросы</h2>
          {article.faqs.map((faq) => (
            <article key={faq.id} className="mt-4">
              <h3 className="font-semibold text-navy">{faq.question}</h3>
              <p className="mt-2 leading-7">{faq.answer}</p>
            </article>
          ))}
          <JsonLd data={{ "@context": "https://schema.org", "@type": "FAQPage", mainEntity: article.faqs.map((faq) => ({ "@type": "Question", name: faq.question, acceptedAnswer: { "@type": "Answer", text: faq.answer } })) }} />
        </section>
      )}
    </article>
  );
}
