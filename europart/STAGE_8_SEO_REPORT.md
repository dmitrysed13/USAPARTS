# EUROPART — Этап 7 / final-spec §8 (SEO Engine)

Date: 2026-11-17. Branch: `cursor/europart-seo-engine-645e`. Parent: admin PR #13.

## Done

### Generator
- Templates (category/brand/model/product/OEM/geo) + manual `SeoMetadata` overrides (`title`, `description`, `h1`, `seoText`, `robotsMode`, `ogImageUrl`)
- `buildSeo` → Metadata with canonical, robots decision, Open Graph (`ru_BY`)

### URL / redirects
- Canonical host from `NEXT_PUBLIC_SITE_URL` (prod: europart.by via env only)
- `/parts/{slug}` → 301 `/product/{slug}`
- `/oem/{oem}` landing — **404 if no priced published products**
- `RedirectRule` applied at request time (`StorefrontRedirectGate`)

### Indexing
- Dual gate: `SEO_INDEXING_ENABLED` env **and** admin `SeoSettings.indexingEnabled`
- Default closed (`robots` Disallow `/`)
- Split sitemaps: pages / categories / brands / products / oem — **quality URLs only** (published + priced offer)
- Search/cart/admin/api/vin/design-system excluded

### Schema.org
- Organization, WebSite, BreadcrumbList, Product+Offer (price required)
- **No AggregateRating**; availability from real public status only

### Internal linking + clusters
- Product/category link helpers (no empty targets as primary nav)
- `SemanticCluster` + keywords storage — **does not auto-create pages**

### Analytics hooks
- GA4 / GSC / Metrika / Webmaster / Merchant IDs via env (override) or admin SeoSettings — no invented credentials

## Migration

`20261117230000_seo_engine`

## Out of scope

- Admin/catalog/search/§5/§6 rework
- CMS articles / FAQPage (later)
- Fake ratings, stock claims, junk auto-landings

## Verification

- typecheck, lint, unit (80), integration (13), build — green
