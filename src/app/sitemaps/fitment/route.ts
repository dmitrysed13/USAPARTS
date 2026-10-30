import { fitmentSitemap, sitemapXml } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(sitemapXml(await fitmentSitemap()), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
