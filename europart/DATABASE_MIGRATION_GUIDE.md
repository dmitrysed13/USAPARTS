# EUROPART 3.0 — миграции

| Миграция | Назначение |
| --- | --- |
| `20261117120000_init_europart3_schema` | Foundation: vehicles + catalog + draft offers/orders |
| `20261117180000_offers_suppliers_prices_stock` | §5: supplier metadata, offer stock/pricing fields, FX, markup, import, sync log, audit |
| `20261117190000_cart_orders_payments` | §6: order statuses, delivery methods, payment tx/webhooks, order item offer snapshots |
| `20261117200000_catalog_vehicle_engine` | Этап 2: engine level + catalog taxonomy links |
| `20261117201000_catalog_taxonomy_seed` | Этап 2: structural seed data |
| `20261117210000_vin_request_history` | Этап 3: VIN lead history |
| `20261117220000_admin_rbac_company` | §7: StaffUser RBAC + company settings |
| `20261117230000_seo_engine` | §8: SEO settings, redirects, clusters |
| `20261117240000_cms_content` | §9: CMS content documents |
| `20261117250000_analytics_attribution` | §10: Order/Lead UTM attribution fields |

Провайдер: PostgreSQL. В init включается `pg_trgm`.

## Локально через Docker

```bash
cd europart
cp .env.example .env
docker compose up -d
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Повторный `npx prisma migrate deploy` без новых файлов пишет, что pending-миграций нет.

`npm run db:migrate` — `prisma migrate dev` при изменении `schema.prisma`. `db push` для этих схем не используется.

## Staging / production deploy

1. Backup Postgres.
2. Set `DATABASE_URL` for the target (never commit).
3. From `europart/`: `npx prisma migrate deploy && npx prisma generate`.
4. Start the standalone Node server / container with production env (see [PRODUCTION.md](PRODUCTION.md)).
5. Verify `/api/health` and smoke (`npm run smoke`).

## Проверка схемы

```bash
npx prisma validate
npx prisma migrate deploy
```
