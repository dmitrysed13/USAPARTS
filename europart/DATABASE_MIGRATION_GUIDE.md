# EUROPART 2.0 — миграция каталога

Первая миграция: `prisma/migrations/20261103140000_init_catalog_schema`.

Имя: `init_catalog_schema`. Провайдер: PostgreSQL. В начале включается расширение `pg_trgm`.

## Локально через Docker

Docker Compose в репозитории поднимает PostgreSQL 17 и Redis. На машине, где собирался этап 2, команды `docker` не было, поэтому контейнер не проверялся. У себя:

```bash
cd "europart 2.0"
cp .env.example .env
docker compose up -d
npx prisma migrate deploy
npx prisma generate
npm run dev
```

Повторный `npx prisma migrate deploy` пишет, что новых миграций нет, и не меняет таблицы.

`npm run db:migrate` — это `prisma migrate dev`. Ею пользуются, когда меняют `schema.prisma` и создают следующую миграцию. Для уже записанной схемы достаточно `migrate deploy`. `db push` для этой схемы не используется.

## Как проверялось здесь

Docker был недоступен. PostgreSQL 16.15 поставлен пакетом и запущен так:

```bash
sudo pg_ctlcluster 16 main start
```

Роль и базы только для этой машины, пароль совпадает с `.env.example` и не является боевым:

```bash
postgresql://europart:europart@127.0.0.1:5432/europart?schema=public
postgresql://europart:europart@127.0.0.1:5432/europart_test?schema=public
```

Подключение идёт на `127.0.0.1`, не через локальный peer-сокет. Миграция применена к обеим пустым базам. Повторный deploy на `europart` завершился сообщением `No pending migrations to apply.`

Таблицы: `Category`, `VehicleBrand`, `VehicleModel`, `VehicleModification`, `PartBrand`, `Product`, `ProductIdentifier`, `ProductImage`, `ProductCompatibility`, `Supplier`, `Warehouse`, `ProductOffer`, `VinRequest`, `SeoMetadata`.

Клиент Prisma генерируется в `src/generated` и в git не входит. `npm run build` вызывает `prisma generate`.

## Тестовая база

Vitest подставляет `europart_test` до импорта тестов. Набор, который очищает таблицы, останавливается, если в адресе нет `europart_test`.

## Шаблон будущего импорта

`imports/catalog-import.template.csv` и `imports/catalog-import.template.xlsx` содержат одну строку заголовков. Цен, остатков и примеров товаров в них нет. Страну бренда оставляют пустой, если она неизвестна. Пустая уверенность совместимости не должна загружаться как `VERIFIED`. Исполняемого импортёра на этом этапе нет.
