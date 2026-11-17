#!/usr/bin/env node
/**
 * Lightweight production smoke (no Playwright). Hits SSR + SEO + health paths.
 * Usage: BASE_URL=http://127.0.0.1:3000 node scripts/smoke.mjs
 */
const base = (process.env.BASE_URL ?? "http://127.0.0.1:3000").replace(/\/$/, "");

const checks = [
  { path: "/api/health", expectStatus: [200] },
  { path: "/", expectStatus: [200] },
  { path: "/catalog", expectStatus: [200, 503] },
  { path: "/search", expectStatus: [200] },
  { path: "/cart", expectStatus: [200] },
  { path: "/checkout", expectStatus: [200] },
  { path: "/robots.txt", expectStatus: [200], bodyIncludes: ["User-agent"] },
  { path: "/sitemap.xml", expectStatus: [200, 404] },
  { path: "/privacy", expectStatus: [200], bodyIncludes: ["noindex", "Обработка данных"] },
  { path: "/admin/login", expectStatus: [200] },
];

let failed = 0;

for (const check of checks) {
  const url = `${base}${check.path}`;
  try {
    const res = await fetch(url, { redirect: "manual" });
    const text = await res.text();
    const statusOk = check.expectStatus.includes(res.status);
    const bodyOk =
      !check.bodyIncludes ||
      check.bodyIncludes.every((needle) => text.toLowerCase().includes(needle.toLowerCase()));
    if (!statusOk || !bodyOk) {
      failed += 1;
      console.error(
        `FAIL ${check.path} status=${res.status} expected=${check.expectStatus.join("|")} bodyOk=${bodyOk}`,
      );
    } else {
      console.log(`OK   ${check.path} ${res.status}`);
    }
  } catch (error) {
    failed += 1;
    console.error(`FAIL ${check.path} ${error instanceof Error ? error.message : error}`);
  }
}

if (failed > 0) {
  console.error(`Smoke failed: ${failed} check(s).`);
  process.exit(1);
}
console.log(`Smoke passed against ${base}`);
