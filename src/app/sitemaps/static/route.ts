import { sitemapXml, type SitemapEntry } from "@/lib/sitemap-data";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const paths = ["/", "/catalog", "/brands", "/vin-search", "/blog"];
  const entries: SitemapEntry[] = paths.map((path) => ({ loc: absoluteUrl(path) }));
  return new Response(sitemapXml(entries), { headers: { "Content-Type": "application/xml; charset=utf-8" } });
}
