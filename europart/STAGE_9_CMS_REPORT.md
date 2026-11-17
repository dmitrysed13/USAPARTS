# EUROPART — Этап 8 / final-spec §9 (CMS / content / GEO)

Date: 2026-11-17. Branch: `cursor/europart-cms-content-9ce4`. Parent: SEO PR #14.

## Done

### Content model
- `CmsDocument` kinds: ARTICLE, GUIDE, FAQ, REVIEW, CATEGORY_CONTENT, VEHICLE_CONTENT
- Status DRAFT / PUBLISHED / ARCHIVED; `publishedAt` / `updatedAt`; author; images; related products
- Reviews require `reviewConfirmed` for storefront
- Empty CMS OK — **no auto-spam seed**

### Admin editor
- `/admin/articles` un-stubbed: list + create form + edit `/admin/articles/[id]`
- SEO metadata wired to `SeoMetadata` (`CMS_DOCUMENT`)
- API: `GET/POST /api/admin/articles`, `GET/PATCH /api/admin/articles/[id]`
- Permission `articles` unchanged (SEO_MANAGER included)

### Public SSR
- `/blog`, `/blog/[slug]`, `/guides`, `/guides/[slug]`, `/faq`, `/reviews`
- Category pages optionally show published CATEGORY_CONTENT
- Related products (published + priced only)

### SEO engine wire
- Templates: `article` / `guide` / `faq` / `review`
- `articleJsonLd` (+ author/dates); `faqPageJsonLd` only for valid Q&A
- Sitemap slice `articles` + hub URLs in `pages` when content exists
- GEO: editorial via CMS + existing `geo` template / `GEO` clusters — **no auto city landings**

## Migration

`20261117240000_cms_content`

## Out of scope

- SEO/admin/catalog/search/§5/§6 rework
- Fake reviews, AggregateRating, junk GEO landings
- Analytics / security stages

## Verification

- typecheck, lint, unit (88), build — green
- integration: Postgres not available in this environment (truncate list updated for CMS tables)
