import { mkdir, writeFile } from "node:fs/promises";
import { pages } from "../src/seo/pages.ts";
import { assertProductionOrigin } from "../src/seo/origin.ts";
import { auditSitemap, renderRobots, renderSitemap } from "../src/seo/seoFiles.ts";
import "./export-seo-csv.mjs";

const origin = assertProductionOrigin(process.env.VITE_SITE_URL ?? "");
const paths = pages.map((page) => page.path);
const sitemap = renderSitemap(paths, origin);
const problems = auditSitemap(sitemap, origin, paths);
if (problems.length > 0) {
  console.error(problems.join("\n"));
  process.exit(1);
}

await mkdir("public", { recursive: true });
await writeFile("public/sitemap.xml", sitemap);
await writeFile("public/robots.txt", renderRobots(origin));
console.log(`seo files: ${paths.length} absolute urls for ${origin}`);
