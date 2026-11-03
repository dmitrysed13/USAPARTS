export function renderSitemap(paths: string[], origin: string): string {
  const body = paths
    .map(
      (path) => `  <url>
    <loc>${origin}${path}</loc>
  </url>`,
    )
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${body}
</urlset>
`;
}

export function renderRobots(origin: string): string {
  return `User-agent: *
Allow: /
Disallow: /404.html

User-agent: Googlebot
Allow: /

User-agent: Yandex
Allow: /
Clean-param: utm_source&utm_medium&utm_campaign&utm_content&utm_term&gclid&yclid&fbclid&ysclid&_ym_debug /

Sitemap: ${origin}/sitemap.xml
`;
}

export function auditSitemap(xml: string, origin: string, paths: string[]): string[] {
  const locs = [...xml.matchAll(/<loc>([^<]*)<\/loc>/g)].map((match) => match[1]);
  const problems: string[] = [];
  if (locs.length !== paths.length) problems.push(`count ${locs.length} != ${paths.length}`);
  if (new Set(locs).size !== locs.length) problems.push("duplicate loc");
  const expected = new Set(paths.map((path) => `${origin}${path}`));
  for (const loc of locs) {
    if (!loc.startsWith("https://")) problems.push(`not https: ${loc}`);
    if (/localhost|127\.0\.0\.1|0\.0\.0\.0|your-domain|example\.com/i.test(loc)) problems.push(`local or placeholder: ${loc}`);
    if (!loc.startsWith(`${origin}/`) && loc !== `${origin}/`) problems.push(`foreign origin: ${loc}`);
    if (!expected.has(loc)) problems.push(`unexpected: ${loc}`);
    if (!loc.endsWith("/") && !loc.endsWith(".html")) problems.push(`slash: ${loc}`);
  }
  for (const loc of expected) {
    if (!locs.includes(loc)) problems.push(`missing: ${loc}`);
  }
  if (xml.includes("noindex")) problems.push("noindex inside sitemap");
  return problems;
}
