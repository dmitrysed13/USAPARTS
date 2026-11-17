import type { AppModule } from "@/modules/types";

export const seoModule = {
  id: "seo",
  stage: 8,
  summary:
    "SEO engine: шаблоны/overrides, canonical+301, robots/sitemaps, schema.org, кластеры, analytics hooks. Без мусорных авто-страниц и fake rating.",
} satisfies AppModule;

export { buildSeo } from "@/modules/seo/generator";
export { applySeoTemplate } from "@/modules/seo/templates";
export { readSeoOverlay } from "@/modules/seo/overlay";
export { isIndexingEnabled, decideIndex, envIndexingFlag } from "@/modules/seo/policy";
export {
  breadcrumbJsonLd,
  organizationJsonLd,
  websiteJsonLd,
  productJsonLd,
  articleJsonLd,
  faqPageJsonLd,
} from "@/modules/seo/schema";
export { linksForProduct, linksForCategory } from "@/modules/seo/linking";
export { buildSitemapSlice, SITEMAP_IDS } from "@/modules/seo/sitemap";
export { getSeoAnalyticsIds, updateSeoSettings } from "@/modules/seo/settings";
export { listSemanticClusters, createSemanticCluster } from "@/modules/seo/clusters";
export { absoluteUrl, canonicalAlternates } from "@/modules/seo/canonical";
export {
  normalizePublicPath,
  productPath,
  partsPath,
  oemPath,
  catalogPath,
  brandPath,
} from "@/modules/seo/paths";
