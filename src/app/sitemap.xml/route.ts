import { productSitemapCount, sitemapIndexXml } from "@/lib/sitemap-data";
import { absoluteUrl } from "@/lib/site";

export const dynamic = "force-dynamic";

export async function GET() {
  const productPages = await productSitemapCount();
  const locs = [
    absoluteUrl("/sitemaps/static"),
    absoluteUrl("/sitemaps/fitment"),
    absoluteUrl("/sitemaps/content"),
    ...Array.from({ length: productPages }, (_item, index) => absoluteUrl(`/sitemaps/products/${index + 1}`)),
  ];
  return new Response(sitemapIndexXml(locs), {
    headers: { "Content-Type": "application/xml; charset=utf-8" },
  });
}
