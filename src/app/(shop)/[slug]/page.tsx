import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { ProductList } from "@/components/product-card";
import { cardInclude, toCard } from "@/lib/dto";
import { prisma } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";

export const revalidate = 300;

const RESERVED = new Set(["admin", "api", "catalog", "brands", "product", "blog", "vin-search", "cart", "checkout", "search", "login", "register", "account", "info", "favorites", "compare"]);

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  if (RESERVED.has(slug)) return {};
  const landing = await prisma.landingPage.findFirst({ where: { slug, isPublished: true } });
  if (!landing) return {};
  return {
    title: landing.seoTitle,
    description: landing.seoDescription,
    alternates: { canonical: `/${landing.slug}` },
    robots: landing.indexable ? { index: true, follow: true } : { index: false, follow: true },
  };
}

export default async function LandingPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  if (RESERVED.has(slug)) notFound();
  const landing = await prisma.landingPage.findFirst({
    where: { slug, isPublished: true },
    include: { products: { include: { product: { include: cardInclude } } } },
  });
  if (!landing) notFound();
  const products = landing.products.filter((link) => link.product.isPublished).map((link) => toCard(link.product));
  return (
    <div className="page py-8">
      <Breadcrumbs items={[{ name: "Главная", href: "/" }, { name: landing.h1 }]} />
      <h1 className="max-w-3xl text-3xl font-semibold text-navy">{landing.h1}</h1>
      <div className="prose-us mt-6 max-w-3xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(landing.body) }} />
      {landing.makeSlug && landing.modelSlug && landing.year && (
        <p className="mt-4">
          <Link className="text-navy underline" href={`/brands/${landing.makeSlug}/${landing.modelSlug}/${landing.year}`}>
            Все запчасти {landing.year} года в каталоге
          </Link>
        </p>
      )}
      <div className="mt-8">
        <h2 className="mb-4 text-xl font-semibold text-navy">Позиции этой страницы</h2>
        <ProductList products={products} />
      </div>
    </div>
  );
}
