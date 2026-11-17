# EUROPART 3.0

Европейские автозапчасти для Беларуси (Минск-first). App Router SSR-витрина: каталог, поиск по артикулу, заявка по VIN. Корзина и онлайн-оплата — следующие этапы. Пустая база — валидное состояние (без фейковых товаров).

Основано на паттернах ветки `cursor/europart-2-0-a5da`, с иерархией **Марка → Модель → Поколение → Модификация → Категория → Товар** и черновыми моделями заказов/лидов.

Документы в репозитории:

- [ARCHITECTURE.md](ARCHITECTURE.md)
- [PROJECT_PLAN.md](PROJECT_PLAN.md)
- [SEO_SPECIFICATION.md](SEO_SPECIFICATION.md)
- [SEARCH_SPECIFICATION.md](SEARCH_SPECIFICATION.md)
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)

Пользовательский план архитектуры (Project): `docs/europart-architecture-plan.md` в store проекта EUROPART.

## Локальный запуск

Node.js ≥ 20.9. Docker — для PostgreSQL/Redis.

```bash
cd europart
cp .env.example .env
docker compose up -d
npm install
npx prisma migrate deploy
npm run dev
```

http://localhost:3000 · health: `/api/health` · дизайн-система: `/design-system` (noindex).

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
