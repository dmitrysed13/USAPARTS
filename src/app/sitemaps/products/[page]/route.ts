import { productSitemap, sitemapXml } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ page: string }> }) {
  const page = Number((await context.params).page);
  if (!Number.isInteger(page) || page < 1) return new Response("Не найдено", { status: 404 });
  const entries = await productSitemap(page);
  if (!entries.length && page !== 1) return new Response("Не найдено", { status: 404 });
  return new Response(sitemapXml(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
