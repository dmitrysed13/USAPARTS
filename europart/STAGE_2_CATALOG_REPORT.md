# EUROPART — Этап 2 (full catalog / vehicle DB)

Date: 2026-11-17. Branch: `cursor/europart-catalog-vehicle-db-0980`. Stack tip parent: cart/orders PR #9.

## Done

- Hierarchy: Make → Model → Generation → Modification → **Engine** → Category → Product.
- `VehicleEngine` table + optional `ProductCompatibility.vehicleEngineId`.
- Modification `slug` required + unique per generation; `isActive` on modifications.
- SSR pages through modification and engine levels; server filters (condition, type, availability, part brand, price, category, year, fuel), sort, pagination.
- Selected vehicle persistence via signed cookie (`europart_vehicle`) + `/api/vehicle` + banner.
- Empty category pages → 404 (no published products in tree). Empty vehicle+category filter combos → 404.
- Catalog index links only categories that have published products; taxonomy roots listed without empty deep links.
- Admin-ready APIs (token gate): brands/models/generations/modifications/engines + categories.
- Structural seed only: 18 priority makes + 15 root categories. **No** products, prices, or stock invented.
- Indexes for fitment/catalog queries.

## Migrations

- `20261117200000_catalog_vehicle_engine`
- `20261117201000_catalog_taxonomy_seed`

## Out of scope (Этап 3+)

- Full OEM/VIN search UX (shared `normalizeArticle` already exists).
- Admin UI screens (API stubs only).
- Fake catalog assortment.

## Verification

- `npm run typecheck` — pass
- `npm run lint` — pass
- `npm test` — 63 pass
- `npm run test:integration` — 13 pass
- `npm run build` — pass (Next.js security upgrade nudge; retry succeeded without upgrading)
