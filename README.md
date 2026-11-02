# USAPARTS

Одностраничный сайт подбора и доставки запчастей для американских авто.

Стек: React, Vite, TypeScript, Tailwind CSS, Lucide.

## Запуск

```bash
npm install
npm run dev
```

Сборка и проверка:

```bash
npm test
npm run build
```

## Заявки

Формы проверяют телефон маской `+7 (999) 123-45-67`. Без адреса вебхука заявка остаётся в `sessionStorage` браузера (`usaparts-leads`). Чтобы отправлять её в CRM, задайте `VITE_LEAD_WEBHOOK` — POST с JSON.

Контакты, адрес и мессенджеры правятся в `src/content.ts`.
