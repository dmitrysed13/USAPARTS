import { mkdir, writeFile } from "node:fs/promises";
import { pages } from "../src/seo/pages.ts";
import { siteOrigin } from "../src/seo/site.ts";
import "./export-seo-csv.mjs";

const origin = siteOrigin();

function loc(path) {
  return origin ? `${origin}${path}` : path;
}

const urls = pages
  .map(
    (page) => `  <url>
    <loc>${loc(page.path)}</loc>
  </url>`,
  )
  .join("\n");

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls}
</urlset>
`;

const sitemapLine = origin ? `\nSitemap: ${origin}/sitemap.xml\n` : "\n";
const robots = `User-agent: *
Allow: /
Disallow: /404.html

User-agent: Googlebot
Allow: /

User-agent: Yandex
Allow: /
Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&gclid&yclid&fbclid&ysclid&_ym_debug /
${sitemapLine}`;

await mkdir("public", { recursive: true });
await writeFile("public/sitemap.xml", sitemap);
await writeFile("public/robots.txt", robots);
console.log(`seo files: ${pages.length} urls${origin ? ` for ${origin}` : " without a production origin"}`);
