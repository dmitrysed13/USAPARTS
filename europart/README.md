# EUROPART 3.0

Европейские автозапчасти для Беларуси (Минск-first). App Router SSR-витрина: каталог, поиск по артикулу, заявка по VIN. **§5:** поставщики, предложения, цены BYN (FX + наценка), склады, импорт CSV/XLSX, SupplierAdapter. Корзина и оплата — §6 (ещё не в этом PR). Пустая база — валидное состояние (без фейковых товаров).

Иерархия: **Марка → Модель → Поколение → Модификация → Категория → Товар**; у товара много `ProductOffer` (предложения поставщиков/складов).

Документы в репозитории:

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [PROJECT_PLAN.md](PROJECT_PLAN.md)
- [SEO_SPECIFICATION.md](SEO_SPECIFICATION.md)
- [SEARCH_SPECIFICATION.md](SEARCH_SPECIFICATION.md)
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- [IMPORT_GUIDE.md](IMPORT_GUIDE.md)
- [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md)

## Локальный запуск

Node.js ≥ 20.9. Docker — для PostgreSQL/Redis.

```bash
cd europart
cp .env.example .env
# optional for admin APIs: ADMIN_API_TOKEN=local-dev-token-16+
docker compose up -d
npm install
npx prisma migrate deploy
npm run dev
```

http://localhost:3000 · health: `/api/health` · дизайн-система: `/design-system` (noindex).

Admin-ready API (Bearer `ADMIN_API_TOKEN`): `/api/admin/suppliers`, `/warehouses`, `/offers`, `/imports`, `/fx-rates`, `/markup-rules`.

## Проверки

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

## Маршруты (SSR)

| Путь | Назначение |
| --- | --- |
| `/` | Главная, search-first |
| `/catalog`, `/catalog/[category]` | Каталог |
| `/brands`, `/brands/[brand]/[model]/[generation]` | Авто-иерархия |
| `/product/[slug]` | Карточка |
| `/search` | Поиск OEM/артикул/кросс |
| `/vin-search` | VIN-заявка (не мгновенный каталог) |
