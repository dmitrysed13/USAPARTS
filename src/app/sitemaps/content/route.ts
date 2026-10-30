import { contentSitemap, sitemapXml } from "@/lib/sitemap-data";

export const dynamic = "force-dynamic";

export async function GET() {
  return new Response(sitemapXml(await contentSitemap()), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
