# EUROPART 2.0

Новая платформа магазина автозапчастей. Каталог, поиск и заявка по VIN читают PostgreSQL. Корзина, оплата и личный кабинет ещё не подключены. Действующий сайт: https://europart.by/

Документы:

- [PROJECT_PLAN.md](PROJECT_PLAN.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- [SEO_SPECIFICATION.md](SEO_SPECIFICATION.md)
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)
- [STAGE_2_REPORT.md](STAGE_2_REPORT.md)
- [CATALOG_API.md](CATALOG_API.md)
- [SEARCH_SPECIFICATION.md](SEARCH_SPECIFICATION.md)
- [VIN_REQUEST_FLOW.md](VIN_REQUEST_FLOW.md)
- [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md)

## Локальный запуск

Нужны Node.js 20.9 или новее и Docker, если нужна база.

```bash
cp .env.example .env
docker compose up -d
npm install
npm run dev
```

Приложение открывается на http://localhost:3000. Дизайн-система: http://localhost:3000/design-system. Проверка процессов: http://localhost:3000/api/health.

Пароли в `docker-compose.yml` только для локальной базы. В production их заменяют секретами окружения.

После первого запуска базы примените миграцию каталога:

```bash
npm run db:validate
npx prisma migrate deploy
```

Команда `npm run db:migrate` вызывает `prisma migrate dev` и нужна, когда схема меняется локально. Повторный `migrate deploy` на уже обновлённой базе ничего не переписывает. Подробности: [DATABASE_MIGRATION_GUIDE.md](DATABASE_MIGRATION_GUIDE.md).

## Проверки

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Образ приложения описан в `Dockerfile`. В среде, где собирался этап 1, Docker не был установлен, поэтому контейнер здесь не запускался.
