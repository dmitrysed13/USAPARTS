# Отчёт о SEO-внедрении USAPARTS

Дата: 2 ноября 2026.

Дизайн, тёмная палитра, оранжевый акцент, шрифты, знак USAPARTS и отправка заявок на `dmitry.chanoff@gmail.com` сохранены. Сайт не переписывался на другой фреймворк: к сборке Vite добавлена предгенерация HTML.

## Что было не так

- Исходный HTML был пустым: текст появлялся только после JavaScript.
- Существовал один адрес, один Title и один Description.
- Не было canonical, robots.txt, sitemap, страницы 404 и разметки Schema.org.
- Главный заголовок не содержал запрос «автозапчасти из США».
- В форме не было отдельных полей модели, VIN, OEM и типа детали.
- Счётчики и коды Вебмастера нельзя было включить настройкой.

Подробности: `docs/SEO_AUDIT.md`.

## Что сделано

- 27 канонических страниц с уникальными Title, Description и H1. Список и правила роста: `docs/SEO_ARCHITECTURE.md`.
- Сборка записывает готовый HTML в `dist/<путь>/index.html`. В нём уже есть текст, заголовок, описание, canonical и JSON-LD.
- Главный H1: «Автозапчасти из США с доставкой в Беларусь».
- На главной добавлены блоки про новые и б/у детали, шаги подбора по VIN и ссылки на услуги, марки и категории. Прежние секции остались на своих местах.
- Форма подбора принимает марку, модель, год, название детали, VIN, OEM, тип «новая или б/у» и телефон. VIN проверяется, если его заполнили. Заявка по-прежнему уходит на почту.
- События `form_submit`, `form_start`, `phone_click`, `messenger_click`, `callback_click`, `quote_click` пишутся в `dataLayer`. GA4 и Метрика подключаются только при настоящих ID.
- JSON-LD: на главной AutoPartsStore, WebSite, WebPage и FAQPage. На внутренних страницах WebPage, BreadcrumbList, Service и FAQPage, если вопросы есть. Рейтинг, цены и Product не добавлялись.
- `robots.txt` разрешает обход, не закрывает CSS и JS, для Яндекса чистит метки рекламы. `sitemap.xml` собирается из реестра страниц. `404.html` отдаётся с `noindex`.
- Пример редиректа HTTP → HTTPS и одного хоста: `deploy/nginx.conf.example`. Для Vercel включён слэш на конце, для Netlify неизвестный адрес отвечает 404.
- Убраны неиспользуемые начертания Manrope 500 и 700. Горизонтальная прокрутка отзывов на узком экране больше не растягивает страницу.

## Страницы

Открыты главная, 9 услуг, 9 марок и 8 категорий. Адреса перечислены в `docs/SEO_ARCHITECTURE.md`.

Не открыты модельные страницы `/ford/mustang/`, `/ford/mustang/kuzov/kapot/`, `/chevrolet/camaro/dvigatel/`, `/jeep/grand-cherokee/kpp/` и блог. Для них нет отдельных фактов, и одинаковый текст только разбавил бы сайт. Запросы «капот Ford Mustang» и «бампер Chevrolet Camaro» пока относятся к странице марки и к `/zapchasti/kuzov/`.

## Проверки

- `npm test`: 17 тестов, включая уникальность Title, Description, H1 и живые ссылки ядра.
- `npm run build`: TypeScript, sitemap, Vite и prerender 27 страниц плюс 404.
- В готовом HTML главной один H1, `lang="ru"`, UTF-8, свой Title, Description, canonical и JSON-LD. У Ford свой Title и canonical `/ford/`.
- Внутренние ссылки с главной и со страницы Ford ведут на существующие HTML-файлы.
- Коды ответа статического сервера: `/` 200, `/ford/` 200, `/ford` 301 на `/ford/`, несуществующий адрес 404, CSS, JS, sitemap, robots и favicon 200.
- Форма на собранном сайте показывает поля модели, VIN, OEM и типа детали. Короткий VIN получает ошибку «VIN состоит из 17 знаков…». Переход на `/ford/` оставляет марку Ford в форме.
- На ширине 390 px у главной нет горизонтальной прокрутки страницы.
- Lighthouse 12, локальный сервер без gzip, главная: Performance 80, SEO 92, Accessibility 100. LCP 3,9 с, CLS 0, Total Blocking Time 10 мс. Это замер этой машины, не обещание полевых Core Web Vitals. Порог LCP 2,5 с здесь не достигнут. INP в лабораторном отчёте нет, вместо него виден TBT.

SEO в Lighthouse не 100, потому что canonical относительный: домен ещё не задан. Абсолютный canonical появится после `VITE_SITE_URL`.

## Изменённые зоны

- Страницы и метаданные: `src/seo/`, `src/App.tsx`, `src/router.tsx`, `src/components/ContentPage.tsx`, `DocumentHead.tsx`, `Guide.tsx`, `NotFound.tsx`, `SiteLink.tsx`, `index.html`.
- Главная и навигация: `Hero.tsx`, `Catalog.tsx`, `Header.tsx`, `Footer.tsx`, `Trust.tsx`, `content.ts`.
- Форма и заявки: `QuoteForm.tsx`, `LeadModal.tsx`, `validation.ts`, `leads.ts`, `PrivacyDialog.tsx`.
- Аналитика: `src/lib/analytics.ts`, `src/main.tsx`, `src/vite-env.d.ts`.
- Сборка: `scripts/generate-seo-files.mjs`, `scripts/prerender.mjs`, `package.json`, `vite.config.ts`, `public/robots.txt`, `public/sitemap.xml`, `public/_redirects`, `vercel.json`, `deploy/nginx.conf.example`.
- Документация: `docs/SEO_AUDIT.md`, `docs/SEO_ARCHITECTURE.md`, `docs/SEO_KEYWORDS.md`, `docs/SEO_ROADMAP.md`, этот отчёт.

## Что осталось

- Нет боевого домена. Canonical и адреса в sitemap корневые, строка `Sitemap:` в robots появится вместе с `VITE_SITE_URL`.
- HTTPS и выбор www настраиваются на хостинге. В репозитории есть пример nginx, этого недостаточно, пока сервер не подключён.
- FormSubmit нужно один раз подтвердить письмом на `dmitry.chanoff@gmail.com`, иначе заявки не доходят.
- Нет `og:image`: не из чего сделать честную картинку для соцсетей.
- Нет частотности запросов. В ядре стоит «нет данных».
- Google может не показать FAQ в расширенных результатах для коммерческого сайта. Разметка оставлена для Яндекса и для смысла страницы.
- Отзывы на главной не размечены как оценки: независимого рейтинга нет.
- Регион в Яндекс Вебмастере нужно выставить вручную.
- Полевые LCP и INP не измерялись. Лабораторный LCP на этой машине 3,9 с.

## Что нужно от владельца

- Постоянный домен и решение, будет ли www.
- Подтверждение Search Console и Вебмастера.
- ID GA4 и номер счётчика Метрики, если аналитика нужна сразу.
- Фото пункта выдачи или работы с деталью для Open Graph.
- Выгрузка Wordstat и Keyword Planner, если нужна частотность.
- Подтверждение, что письмо FormSubmit активировано.
- Факты для модельных страниц, если их пора открывать: чем поколение отличается и какие узлы чаще путают. Цены и остатки по-прежнему не публиковать, пока их нет.

Следующие шаги по продвижению: `docs/SEO_ROADMAP.md`.
