# EUROPART 3.0 — миграции

| Миграция | Назначение |
| --- | --- |
| `20261117120000_init_europart3_schema` | Foundation: vehicles + catalog + draft offers/orders |
| `20261117180000_offers_suppliers_prices_stock` | §5: supplier metadata, offer stock/pricing fields, FX, markup, import, sync log, audit |
| `20261117190000_cart_orders_payments` | §6: order statuses, delivery methods, payment tx/webhooks, order item offer snapshots |

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

## Проверка схемы

```bash
npx prisma validate
npx prisma migrate deploy
```
