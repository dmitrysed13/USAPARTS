# EUROPART — Этап 9 / final-spec §10 (Analytics)

Date: 2026-11-17. Branch: `cursor/europart-analytics-bc73`. Parent: CMS PR #15.

## Done

### GA4 + Yandex Metrika
- Scripts load only when `GA4_MEASUREMENT_ID` / `YANDEX_METRIKA_ID` (env) or SeoSettings IDs are set
- Empty IDs → no scripts / no network (no-op)
- Events: `product_view`, `search`, `vin_search`, `add_to_cart`, `begin_checkout`, `purchase_order_created`, `purchase`, `lead_submit` (Metrika goals mirror names)
- Payload sanitize strips PII keys and email/phone/VIN-looking values

### Purchase gate
- `purchase_order_created` on successful checkout
- `purchase` only when `paymentState` or `status` is `PAID` (verified payment), deduped in localStorage
- Never fires purchase on bare order create

### Attribution
- UTM first/last cookies (`ep_attr_first` / `ep_attr_last`)
- Stored on Order + Lead at create (source fields only — no customer PII)

### Admin KPI dashboard
- `/admin/analytics` — orders, paid, revenue, AOV, leads, VIN, orders/lead, first/last touch rollups
- Wired from existing order/lead data; link from dashboard

### SEO hooks
- Reuses `getSeoAnalyticsIds`; head meta `europart-ga4-id` / `europart-metrika-id`

## Migration

`20261117250000_analytics_attribution`

## Out of scope

- CMS / SEO / admin RBAC / catalog / search / §5 / §6 rework
- Measurement Protocol API secrets
- USAPART root
- Next.js security upgrade (separate)

## Verification

- typecheck, lint, unit (98), build — green
- integration: Postgres may be unavailable in this environment
