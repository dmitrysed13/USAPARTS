# EUROPART 2.0

Новая платформа магазина автозапчастей. Каталог, корзина и личный кабинет ещё не подключены. Действующий сайт: https://europart.by/

Документы:

- [PROJECT_PLAN.md](PROJECT_PLAN.md)
- [ARCHITECTURE.md](ARCHITECTURE.md)
- [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- [SEO_SPECIFICATION.md](SEO_SPECIFICATION.md)
- [IMPLEMENTATION_STATUS.md](IMPLEMENTATION_STATUS.md)

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

База на этапе 1 без таблиц. Миграция появится на этапе 2:

```bash
npm run db:validate
npm run db:migrate
```

## Проверки

```bash
npm run typecheck
npm run lint
npm run test
npm run build
```

Образ приложения описан в `Dockerfile`. В среде, где собирался этап 1, Docker не был установлен, поэтому контейнер здесь не запускался.
