import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { prisma } from "@/lib/db";
import { renderMarkdown } from "@/lib/markdown";
import { deliveryProviderStatus } from "@/lib/integrations/delivery";
import { paymentStatus } from "@/lib/integrations/payments";

export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findFirst({ where: { slug, isPublished: true } });
  if (!page) return {};
  return { title: page.seoTitle || page.title, description: page.seoDescription || undefined, alternates: { canonical: `/info/${page.slug}` } };
}

export default async function InfoPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const page = await prisma.page.findFirst({ where: { slug, isPublished: true } });
  if (!page) notFound();
  const delivery = slug === "delivery" ? deliveryProviderStatus() : null;
  const payment = slug === "delivery" || slug === "how-to-order" ? paymentStatus() : null;
  return (
    <div className="page py-8">
      <Breadcrumbs items={[{ name: "Главная", href: "/" }, { name: page.title }]} />
      <h1 className="text-3xl font-semibold text-navy">{page.title}</h1>
      <div className="prose-us mt-6 max-w-3xl" dangerouslySetInnerHTML={{ __html: renderMarkdown(page.body) }} />
      {delivery && <p className="mt-4 max-w-3xl text-sm leading-6">Статус перевозчика: {delivery.message}</p>}
      {payment && <p className="mt-2 max-w-3xl text-sm leading-6">Статус оплаты: {payment.message}</p>}
    </div>
  );
}
