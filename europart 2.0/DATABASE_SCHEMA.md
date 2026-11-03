# EUROPART 2.0 — схема базы данных

Контракт этапа 2. В `prisma/schema.prisma` пока только генератор клиента и PostgreSQL, без таблиц. Миграция не создавалась.

## Правила

- Идентификаторы: UUID, `@default(uuid())` или `gen_random_uuid()`.
- Время: `timestamptz`.
- Деньги: `Int`, копейки BYN. Имя поля заканчивается на `Minor`. Дробные деньги не хранятся.
- Публичные URL: слаг в нижнем регистре, латиница и дефис. Уникальность указана у каждой сущности.
- Заказ, оплата и заявка не удаляются каскадом вместе с пользователем. Для них действует `Restrict`.
- Закупочные поля есть только у внутренних моделей. Публичный репозиторий их не выбирает. Это проверяется тестом на этапе 2.
- Журнал `AuditLog` только дополняется.

## Пользователи и доступ

### User

Учётная запись. Поля Better Auth дополняются телефоном.

- `id`, `email` уникальный, `emailVerified`, `name`, `phone`, `image`
- `createdAt`, `updatedAt`

### Session, Account, Verification

Стандартные таблицы Better Auth: сессия, способ входа, подтверждение почты. Секрет провайдера не дублируется в своих колонках.

### Role

Справочник ролей сотрудников: `SUPER_ADMIN`, `ADMIN`, `MANAGER`, `WAREHOUSE_MANAGER`, `SEO_MANAGER`, `B2B_MANAGER`.

### UserRole

`userId` + `roleId`, уникальная пара. Покупатель B2C не получает строку роли.

### Customer

Розничный профиль, один к одному с `User`: телефон, согласие на новости, дата согласия. Согласие хранит версию документа, а не сам текст политики.

### Organization

СТО или опт.

- `type`: `LEGAL_ENTITY` или `SOLE_PROPRIETOR`
- `legalName`, `unp` уникальный, юридический адрес
- `status`: `PENDING`, `APPROVED`, `REJECTED`, `SUSPENDED`
- `managerUserId` — персональный менеджер из сотрудников, nullable
- условия оплаты и доставки текстом, пока нет отдельных справочников
- даты создания и решения по заявке

### OrganizationMember

- `organizationId`, `userId`, уникальная пара
- роль внутри организации: `OWNER`, `BUYER`, `ACCOUNTANT`, `VIEWER`
- `Restrict` при удалении пользователя, у которого есть заказы организации

### Consent

Кто, когда и какую версию согласия принял: заказ, VIN, кабинет, B2B. Хранятся цель, версия документа, время и IP. Текст документа лежит в CMS, не в этой таблице.

## Автомобили

### Brand

Марка автомобиля: `name`, `slug` уникальный, `priority`, `isPublished`. Список марок редактируется в админке. Приоритетные марки из брифа заводятся только как справочник, без пустых посадочных страниц.

### VehicleModel

`brandId`, `name`, `slug` уникален внутри марки, `yearFrom`, `yearTo`, `isPublished`.

### VehicleModification

`modelId`, название, годы, имя двигателя, код двигателя, топливо, мощность, `isPublished`.

### Vehicle

Автомобиль в кабинете покупателя: пользователь, марка, модель, модификация nullable, VIN nullable, год, название, признак основного.

## Каталог

### PartCategory

Дерево. `parentId` nullable, `name`, `slug` уникален глобально, описание, порядок, `isPublished`.

Стартовые слаги, когда появятся реальные позиции: `dvigateli`, `tormoznaya-sistema`, `podveska`, `kuzovnye-detali`, `optika`, `filtry`, `masla-i-zhidkosti`. Автостёкла и трансмиссия со старого сайта добавляются отдельными категориями, если в них есть товар.

### PartBrand

Производитель детали: `name`, `slug`, признак оригинального бренда.

### Product

Продаваемая позиция, один SKU.

- `sku` уникальный, `slug` уникальный, `name`
- `article` как ввёл производитель и `articleNormalized` для поиска
- `partBrandId`, `categoryId`
- `condition`: `NEW` или `USED`
- `origin`: `ORIGINAL` или `ANALOG`
- описание, гарантия, `minOrderQty`
- `groupId` nullable и `variantLabel` nullable, если у детали есть варианты
- `isPublished`
- статус наличия на карточке не хранится отдельно от предложений: он вычисляется из активных `ProductOffer`, чтобы не расходиться с остатком

Нельзя опубликовать товар без названия, артикула, производителя, категории и хотя бы одного активного предложения с ценой для выбранной аудитории.

### ProductCode

Альтернативные номера.

- `productId`
- `kind`: `MANUFACTURER`, `OEM`, `CROSS`
- `rawValue`, `normalizedValue`
- индекс по `normalizedValue`
- уникальность `(productId, kind, normalizedValue)`

### ProductImage

`url`, `alt`, порядок. Нет изображения — нет строки. Заглушка «фото» не записывается как фото товара.

### ProductCompatibility

`productId`, `brandId`, `modelId` nullable, `modificationId` nullable, годы, примечание. Строка без марки не создаётся.

### ProductGroup

Необязательная группа вариантов: общее название и слаг. Варианты — отдельные `Product`.

## Предложения, склад, цены

### Supplier

Внутренний справочник. `name`, `code` уникальный, контакты, `isActive`. На витрину имя не попадает.

### Warehouse

`name`, `code`, `type` `OWN` или `SUPPLIER`, `supplierId` nullable, город.

### Stock

Физический или поставщицкий остаток.

- уникальная пара `(productId, warehouseId)`
- `quantity >= 0`, `reserved >= 0`, `reserved <= quantity`
- `incomingQty`, `leadTimeDays` nullable
- `updatedAt`

Доступно к продаже: `quantity - reserved`.

### StockMovement

История: `stockId`, дельта, причина (`RECEIPT`, `RESERVE`, `RELEASE`, `ADJUSTMENT`, `ORDER`), сотрудник, время.

### ProductOffer

То, из чего собирается цена и срок для покупателя.

- `productId`, `supplierId` nullable, `warehouseId` nullable
- `source`: `OWN_STOCK` или `SUPPLIER`
- `quantityAvailable`, `reserved`, `leadTimeDays` nullable, `minOrderQty`
- `costPriceMinor` — только внутреннее
- `retailPriceMinor` nullable, `b2bPriceMinor` nullable
- `currency` по умолчанию `BYN`
- `availability`: `IN_STOCK`, `LOW_STOCK`, `ON_ORDER`, `INCOMING`, `OUT_OF_STOCK`, `DISCONTINUED`
- `isActive`

Статусы на русском в интерфейсе: в наличии, мало на складе, под заказ, ожидается поставка, нет в наличии, снят с продажи.

Проверка: активное предложение имеет хотя бы одну цену. Снятое с продажи не активно.

### PriceList и PriceListItem

Именной прайс: аудитория `RETAIL`, `B2B` или конкретная `organizationId`. Период действия. Позиция: товар и `priceMinor`. Уникальность `(priceListId, productId)`.

### PriceRule

Скидка организации, категории или бренда детали: процент, приоритет, период. Процент от 0 до 100. Правило не создаёт цену, если нет базового предложения.

### PriceChange

История розницы, опта и закупки: старое и новое значение, сотрудник, время. Закупка в этой таблице тоже внутренняя.

Порядок выбора цены на сервере:

1. Активная позиция персонального прайса организации.
2. Подходящее `PriceRule` с наибольшим приоритетом.
3. `b2bPriceMinor` для одобренной организации.
4. Для розницы — только `retailPriceMinor`.
5. Если ступени нет, цена не показывается и товар нельзя положить в корзину.

## Корзина и заказ

### Cart

`userId` nullable, `guestToken` nullable, `organizationId` nullable, валюта, время. Ровно один владелец: пользователь или гостевой токен.

### CartItem

Товар, предложение, количество, снимок `priceMinor`. Снимок справочный. Перед заказом сервер перечитывает предложение.

### Order

- человекочитаемый `number`, уникальный
- `userId` nullable, `organizationId` nullable
- статус: `NEW`, `CONFIRMED`, `AWAITING_SUPPLY`, `PICKING`, `HANDED_TO_DELIVERY`, `COMPLETED`, `CANCELLED`
- контакт: имя, телефон, email
- комментарий
- суммы `subtotalMinor`, `totalMinor`, валюта
- `placedAt`

Заказ создаётся в одной транзакции со строками. Если транзакция не зафиксирована, клиент получает ошибку, а не номер заказа.

### OrderItem

Снимки названия, артикула, количества, цены и суммы. Снимок нужен, даже если товар позже изменится.

### Payment

`provider`, статус `PENDING`, `AUTHORIZED`, `PAID`, `FAILED`, `REFUNDED`, сумма, внешний идентификатор. Статус `PAID` пишет только обработчик подтверждения провайдера. На этапе 1 провайдера нет.

### Delivery

Способ, статус, адрес, трек, срок. Способ выбирается из подтверждённого справочника. Пока справочник пуст, checkout не предлагает доставку.

### Address

Адрес кабинета: пользователь или организация, подпись, город, улица, комментарий, признак основного.

## Заявки и контент

### VinRequest

VIN, марка, модель, год, двигатель, название детали, артикул, имя, телефон, email, комментарий, пользователь nullable, статус `NEW`, `IN_PROGRESS`, `DONE`, `CANCELLED`. Заявка не означает, что VIN расшифрован.

### Lead

Прочее обращение: тип, контакты, сообщение, статус, время.

### Favorite

Пара пользователь + товар, уникальная.

### SearchHistory

Пользователь или гостевой токен, исходный запрос, нормализованный запрос, время.

### Review

Автор, город, текст, оценка, дата, `isPublished`, ссылка на заказ nullable. Публикация только после подтверждения. Импорта старых отзывов нет.

### Article

Блог: слаг, заголовок, анонс, текст, статус `DRAFT` или `PUBLISHED`, дата публикации.

### Page

Информационная страница CMS: слаг, заголовок, текст, статус.

### FaqItem

Вопрос, ответ, порядок, область (`GLOBAL`, `CATEGORY`, `PAGE`), ссылка на сущность nullable, публикация.

## SEO и журнал

### SeoMetadata

Уникальные title, description, H1, canonical, robots и изображение для конкретной сущности. Уникальность `(entityType, entityId, locale)`. Локаль по умолчанию `ru`. Второй язык не заводится, пока нет перевода.

### SeoTemplate

Шаблон для типа страницы: категория, подкатегория, марка, модель, модель+категория, товар, бренд детали. Шаблон не заменяет уникальный текст. Страница без собственного содержания не индексируется, даже если шаблон заполнен.

### Redirect

`fromPath` уникальный, `toPath`, код `301` или `410`, `isActive`.

### AuditLog

Сотрудник, действие, тип сущности, идентификатор, снимок изменения в JSON, IP, время. Покупательские пароли и закупочные массивы целиком в снимок не пишутся: только идентификатор поля и факт изменения.

### ImportJob

Импорт CSV/XLSX: кто запустил, организация nullable, тип (`PRODUCTS`, `PRICES`, `STOCK`, `B2B_ORDER`), статус, имя файла, отчёт об ошибках, время. Файл не хранится в репозитории.

## Индексы

- `Product.slug`, `Product.articleNormalized`, `Product.categoryId`, `Product.isPublished`
- `ProductCode.normalizedValue`
- `PartCategory.slug`, `Brand.slug`, `VehicleModel (brandId, slug)`
- `ProductOffer (productId, isActive)`
- `Order.number`, `Order.userId`, `Order.organizationId`, `Order.status`
- `VinRequest.status`, `Lead.status`
- `AuditLog (entityType, entityId)`, `AuditLog.createdAt`

## Что увидит клиент

Из предложения наружу выходят: идентификатор предложения, статус, доступное количество, срок, цена выбранной аудитории, валюта и вид цены.

Не выходят: закупка, поставщик, резерв, маржа, персональная скидка другого клиента, внутренние комментарии.

Гостевой и розничный запрос не получает `b2bPriceMinor`. Это правило уже покрыто тестом чистой функции `toPublicOffer`. На этапе 2 тот же запрет фиксируется на запросе к базе.
