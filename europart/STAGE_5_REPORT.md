# EUROPART 3.0 — отчёт §5 (suppliers / offers / prices / stock)

Дата: 2026-11-17.

База: foundation PR #6 (`cursor/europart-architecture-foundation-ef85`). Корзина/заказы (§6) **не** входили в этот этап.

## Сделано

- Миграция `20261117180000_offers_suppliers_prices_stock`: Supplier/Warehouse enrichment, ProductOffer stock+pricing fields, Product.mpn + ProductAttribute, FxRate, MarkupRule, OfferPriceHistory, Import*, SupplierSyncLog, AuditLog.
- Pricing: `purchase → FX → markup → extras → retail BYN`; без курса/правила розница не вычисляется.
- Stock: `stockSource` + `stockConfirmed` + `stockUpdatedAt`; витрина не подтверждает неподтверждённый остаток.
- Import CSV/XLSX (ExcelJS): upload → mapping preview → commit/rollback; empty cells do not wipe.
- SupplierAdapter port: rate limit, retry, sync log; unconfigured fails closed.
- Admin-ready APIs under `/api/admin/*` gated by `ADMIN_API_TOKEN`.
- No fake suppliers/products/prices seeded.

## Проверки (agent)

| Check | Result |
| --- | --- |
| `npx prisma validate` | ok |
| `npm run typecheck` | ok |
| `npm run lint` | ok |
| `npm run test` | 46 tests |
| `npm run build` | ok (Next.js security upgrade nudge noted; retry succeeded) |
| `prisma migrate deploy` | SQL migration present; Docker/Postgres not available in this environment to apply live |

## Не входит

§6 cart/checkout/payments, full admin UI, Better Auth, concrete supplier HTTP adapters, SEO open.
