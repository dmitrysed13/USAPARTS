# EUROPART — Этап 3 (OEM / VIN search + vehicle picker)

Date: 2026-11-17. Branch: `cursor/europart-oem-vin-search-645e`. Parent: catalog PR #10.

## Done

### Article search
- OEM, MPN, article, cross, analogs via identifiers + `Product.mpn` / `Product.oem`
- Normalization: case, spaces, dashes, dots, slashes (`normalizeArticle`)
- Results expose brand/manufacturer, analogs/cross, verified compatibility, price, stock, **offer source** (`own_stock` | `supplier`) when present — empty when not
- No invented hits

### VIN
- Validate + save `VinRequest` with comment
- History table `VinRequestHistory` + admin GET/PATCH
- Manager notify hooks (email/Telegram fail closed without creds)
- `VinCatalogPort` / `unconfiguredVinCatalog` — **never** fake decode

### Vehicle picker
- Cascading UI: make → model → generation → year → modification → engine
- `/api/catalog/vehicle-options`
- Persists via existing selected-vehicle signed cookie (aligned with catalog)

## Migration

`20261117210000_vin_request_history`

## Out of scope

- Catalog hierarchy (PR #10), §5/§6 commerce
- Real VIN decoder / TecDoc wiring

## Verification

- typecheck, lint, unit (66), integration (13), build — green
