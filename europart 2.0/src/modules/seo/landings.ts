import { company } from "@/config/company";

export type FaqItem = {
  question: string;
  answer: string;
};

export type Assortment =
  | { kind: "all" }
  | { kind: "condition"; condition: "USED" }
  | { kind: "vehicle"; brandSlugs: string[]; categorySlugs: string[] };

export type LandingSlug =
  | "avtozapchasti"
  | "kupit-zapchasti"
  | "katalog-zapchastey"
  | "magazin-avtozapchastey"
  | "avtozapchasti-belarus"
  | "avtozapchasti-minsk"
  | "avtozapchasti-gomel"
  | "zapchasti-audi"
  | "zapchasti-mtz"
  | "bu-zapchasti";

export type LandingLink = {
  href: string;
  anchor: string;
  whenIndexable?: LandingSlug;
};

export type LandingDefinition = {
  slug: LandingSlug;
  path: `/${LandingSlug}`;
  queries: string[];
  title: string;
  description: string;
  h1: string;
  intro: string;
  body: string[];
  advantages: string[];
  orderNote: string;
  faq: FaqItem[];
  emptyTitle: string;
  emptyDescription: string;
  assortment: Assortment;
  /** Editorial pages may be indexed without products. Assortment pages wait for a real row. */
  policy: "editorial" | "needs-products";
  defaultIndex: boolean;
  links: LandingLink[];
};

export type LandingOverride = {
  h1: string | null;
  title: string | null;
  description: string | null;
  intro: string | null;
  body: string | null;
  faq: FaqItem[] | null;
  canonicalPath: string | null;
  indexable: boolean | null;
  published: boolean;
  relatedProductSlugs: string[];
  relatedCategorySlugs: string[];
};

export type ResolvedLanding = {
  slug: LandingSlug;
  path: string;
  queries: string[];
  title: string;
  description: string;
  h1: string;
  intro: string;
  body: string[];
  advantages: string[];
  orderNote: string;
  faq: FaqItem[];
  emptyTitle: string;
  emptyDescription: string;
  assortment: Assortment;
  canonicalPath: string;
  indexable: boolean;
  published: boolean;
  links: LandingLink[];
  relatedProductSlugs: string[];
  relatedCategorySlugs: string[];
};

const phone = `${company.phoneDisplay}, ${company.phoneNote.toLowerCase()}`;

export const landingDefinitions: LandingDefinition[] = [
  {
    slug: "avtozapchasti",
    path: "/avtozapchasti",
    queries: ["запчасти", "авто запчасти"],
    title: "Автозапчасти из Европы",
    description:
      "Автозапчасти из Европы для легковых автомобилей. Подбор по VIN и артикулу, заявка менеджеру и самовывоз в Бресте.",
    h1: "Автозапчасти из Европы",
    intro:
      "EUROPART подбирает автозапчасти из Европы для легковых автомобилей. В списке ниже только те позиции, которые уже опубликованы. Остальное запрашивается по VIN или артикулу, без обещания наличия.",
    body: [
      "Компания работает как ООО «БелТРЭК» в Бресте. На этой платформе нет корзины и онлайн-оплаты: заявка попадает менеджеру, а цена появляется только вместе с опубликованным предложением.",
      "Сайт europart.by не подменяет собой разборку или доску объявлений. Если детали нет среди карточек, пустая витрина означает, что ассортимент ещё не загружен, а не что деталь снята с производства.",
    ],
    advantages: [
      "Подбор по VIN и по оригинальному артикулу, без автоматической расшифровки номера.",
      "В карточке видна только розничная цена опубликованного предложения.",
      "Самовывоз подтверждён по адресу в Бресте.",
      "По Беларуси можно позвонить на бесплатный номер.",
    ],
    orderNote:
      "Напишите название детали и VIN или артикул. Менеджер проверяет совместимость вручную и отвечает по телефону или почте, которые вы оставите в заявке.",
    faq: [
      {
        question: "Как подобрать автозапчасть по VIN?",
        answer:
          "VIN вводится в форму заявки вместе с названием детали. Номер сохраняется для ручной проверки и сам по себе не расшифровывается.",
      },
      {
        question: "Можно ли заказать деталь по оригинальному артикулу?",
        answer:
          "Да. Артикул или OEM указывается в той же заявке либо в строке поиска. Совместимость сверяет менеджер, а не фильтр сайта.",
      },
      {
        question: "Почему в списке может не быть нужной детали?",
        answer:
          "Каталог показывает только опубликованные товары. Пустой список не является сообщением об отсутствии детали на рынке.",
      },
      {
        question: "Где находится EUROPART?",
        answer: `Самовывоз подтверждён в Бресте, ${company.streetAddress}. Телефон ${phone}.`,
      },
    ],
    emptyTitle: "Опубликованных автозапчастей пока нет",
    emptyDescription:
      "Загруженный ассортимент появится карточками. До этого подбор идёт по VIN и артикулу.",
    assortment: { kind: "all" },
    policy: "editorial",
    defaultIndex: true,
    links: [
      { href: "/kupit-zapchasti", anchor: "Как купить запчасть" },
      { href: "/katalog-zapchastey", anchor: "Как читать каталог" },
      { href: "/magazin-avtozapchastey", anchor: "Адрес магазина в Бресте" },
      { href: "/avtozapchasti-belarus", anchor: "Заявка по Беларуси" },
      { href: "/catalog", anchor: "Перейти в разделы" },
      { href: "/vin-search", anchor: "Оставить VIN" },
      { href: "/brands", anchor: "Марки в каталоге" },
      {
        href: "/zapchasti-audi",
        anchor: "Опубликованные запчасти Audi",
        whenIndexable: "zapchasti-audi",
      },
      {
        href: "/bu-zapchasti",
        anchor: "Опубликованные б/у позиции",
        whenIndexable: "bu-zapchasti",
      },
    ],
  },
  {
    slug: "kupit-zapchasti",
    path: "/kupit-zapchasti",
    queries: ["купить запчасти", "продажа запчастей"],
    title: "Купить автозапчасти из Европы",
    description:
      "Закажите автозапчасть из Европы по VIN или артикулу. Цена берётся из опубликованного предложения, самовывоз — в Бресте.",
    h1: "Купить автозапчасти из Европы",
    intro:
      "Купить запчасть здесь значит отправить заявку, а не положить товар в корзину. Оплаты на новой платформе нет: менеджер называет цену, когда предложение уже опубликовано или подобрано по артикулу.",
    body: [
      "Запрос «продажа запчастей» ведёт на эту же страницу. Отдельный адрес с тем же смыслом только конкурировал бы с инструкцией по заявке, поэтому он перенаправляется сюда.",
      "После заявки с вами связываются по указанному телефону или почте. Способ оплаты и курьерская служба для новой платформы не подтверждены, их нельзя выбрать на сайте.",
    ],
    advantages: [
      "Один сценарий покупки: VIN, артикул или название детали.",
      "Цена не выдумывается в тексте страницы.",
      "Заявку можно продублировать звонком в часы работы.",
      "Самовывоз согласуется по брестскому адресу.",
    ],
    orderNote:
      "Укажите автомобиль, год и что именно нужно заменить. Если артикул уже есть, добавьте его: так сверка быстрее, но она всё равно ручная.",
    faq: [
      {
        question: "Как узнать стоимость запчасти?",
        answer:
          "Если предложение опубликовано, розничная цена видна в карточке. Для остальных позиций стоимость сообщает менеджер после заявки. На странице нет примерных цен.",
      },
      {
        question: "Можно ли оплатить заказ на сайте?",
        answer:
          "Нет. Корзина и онлайн-оплата не подключены. Сначала заявка и ответ менеджера.",
      },
      {
        question: "Можно ли подобрать аналог оригинальной детали?",
        answer:
          "Аналог ищется по артикулу и описанию. На сайте он появляется только как опубликованный товар типа «аналог», а не как автоматическая замена.",
      },
      {
        question: "Куда писать, если форма неудобна?",
        answer: `Позвоните ${phone} или напишите на ${company.email}. Часы: пн–пт 9:00–21:00, сб–вс 11:00–19:00.`,
      },
    ],
    emptyTitle: "В продаже на витрине пока пусто",
    emptyDescription:
      "Кнопка покупки появится у карточки с ценой. Сейчас заказ оформляется заявкой.",
    assortment: { kind: "all" },
    policy: "editorial",
    defaultIndex: true,
    links: [
      { href: "/avtozapchasti", anchor: "Какие автозапчасти подбираем" },
      { href: "/katalog-zapchastey", anchor: "Сначала посмотреть каталог" },
      { href: "/magazin-avtozapchastey", anchor: "Где забрать в Бресте" },
      { href: "/vin-search", anchor: "Форма заявки" },
      { href: "/catalog", anchor: "Опубликованные разделы" },
    ],
  },
  {
    slug: "katalog-zapchastey",
    path: "/katalog-zapchastey",
    queries: ["каталог запчастей"],
    title: "Каталог автозапчастей",
    description:
      "Каталог автозапчастей EUROPART: категории и марки из базы. В списке только опубликованные товары, пустой раздел не означает наличие.",
    h1: "Каталог автозапчастей",
    intro:
      "Каталог запчастей на EUROPART разделён на два слоя. Эта страница объясняет, как он устроен. Рабочий список категорий открывается отдельно и показывает только то, что заведено в базе.",
    body: [
      "Фильтры по цене, наличию и комбинации параметров не являются отдельными страницами и в поиск не отдаются. Так каталог не плодит пустые адреса с одинаковым текстом.",
      "Карточка попадает в каталог после публикации. Черновик импорта, закупочная цена и поставщик на витрине не видны.",
    ],
    advantages: [
      "Разделы читаются из базы, а не из списка ключевых слов.",
      "Пустая категория не выдаётся за наличие.",
      "Поиск по артикулу стоит рядом с категориями.",
      "Марки автомобиля вынесены в собственный справочник.",
    ],
    orderNote:
      "Если раздела ещё нет, не ждите его появления под ваш запрос. Оставьте VIN и название детали: подбор не зависит от того, заведена ли категория.",
    faq: [
      {
        question: "Чем эта страница отличается от рабочего каталога?",
        answer:
          "Здесь описано, как устроен каталог. Сами категории и карточки открываются в разделе «Каталог» по адресу /catalog.",
      },
      {
        question: "Появятся ли страницы для каждой комбинации фильтров?",
        answer:
          "Нет. Сортировка, цена и наличие остаются параметрами списка и не индексируются как отдельные посадочные.",
      },
      {
        question: "Как проверить совместимость запчасти с автомобилем?",
        answer:
          "У опубликованного товара может быть подтверждённая совместимость. Если её нет в карточке, проверку делает менеджер по VIN.",
      },
      {
        question: "Можно ли найти деталь по артикулу, не зная категорию?",
        answer:
          "Да. Строка поиска на странице ищет по опубликованному названию и артикулу, категория для этого не обязательна.",
      },
    ],
    emptyTitle: "В каталоге ещё нет карточек",
    emptyDescription:
      "Когда позиции опубликуют, они появятся и здесь, и в рабочем каталоге.",
    assortment: { kind: "all" },
    policy: "editorial",
    defaultIndex: true,
    links: [
      { href: "/catalog", anchor: "Открыть рабочий каталог" },
      { href: "/avtozapchasti", anchor: "Об автозапчастях EUROPART" },
      { href: "/kupit-zapchasti", anchor: "Если детали нет в списке" },
      { href: "/brands", anchor: "Список марок" },
      { href: "/vin-search", anchor: "Заявка, если раздела нет" },
    ],
  },
  {
    slug: "magazin-avtozapchastey",
    path: "/magazin-avtozapchastey",
    queries: ["магазин запчастей"],
    title: "Магазин автозапчастей в Бресте",
    description:
      "Магазин EUROPART в Бресте, ул. Московская, 364. Телефон, часы работы и заявка на автозапчасть по VIN или артикулу.",
    h1: "Магазин автозапчастей в Бресте",
    intro:
      "Магазин запчастей EUROPART — это одна подтверждённая точка ООО «БелТРЭК» в Бресте. Страница собрана для визита и звонка, а не как общий обзор ассортимента.",
    body: [
      `Адрес самовывоза: ${company.city}, ${company.streetAddress}. Телефон ${company.phoneDisplay}. Почта ${company.email}. Пн–пт 9:00–21:00, сб–вс 11:00–19:00.`,
      "УНП, банковские реквизиты и публичная оферта на прежнем сайте не были указаны, поэтому здесь их нет. Отзывы и оценки тоже не публикуются, пока нет подтверждённого источника.",
    ],
    advantages: [
      "Адрес и часы совпадают с публичной карточкой компании.",
      "Звонок по Беларуси бесплатный.",
      "Перед визитом деталь лучше согласовать заявкой.",
      "Другие города не указаны как магазины.",
    ],
    orderNote:
      "Для самовывоза сначала нужна подтверждённая позиция. Приезд без заявки не гарантирует, что деталь лежит на Московской.",
    faq: [
      {
        question: "Есть ли у EUROPART магазин кроме Бреста?",
        answer:
          "На сайте подтверждена только точка в Бресте, ул. Московская, 364. Минск, Гомель и другие города магазинами не названы.",
      },
      {
        question: "Можно ли приехать без заявки?",
        answer:
          "Адрес открыт в указанные часы, но наличие конкретной детали без опубликованной карточки или ответа менеджера не подтверждается.",
      },
      {
        question: "Какой телефон магазина?",
        answer: `${company.phoneDisplay}. ${company.phoneNote}. Письмо можно отправить на ${company.email}.`,
      },
      {
        question: "Где посмотреть договор и реквизиты?",
        answer:
          "Юридические тексты будут опубликованы после проверки юристом. До этого реквизиты в карточке магазина не указываются.",
      },
    ],
    emptyTitle: "На витрине магазина карточек пока нет",
    emptyDescription:
      "Адрес и телефон от этого не меняются. Ассортимент добавится опубликованными товарами.",
    assortment: { kind: "all" },
    policy: "editorial",
    defaultIndex: true,
    links: [
      { href: "/avtozapchasti", anchor: "Автозапчасти из Европы" },
      { href: "/kupit-zapchasti", anchor: "Как оставить заявку" },
      { href: "/avtozapchasti-belarus", anchor: "Покупателям из других городов" },
      { href: "/vin-search", anchor: "Согласовать деталь до визита" },
    ],
  },
  {
    slug: "avtozapchasti-belarus",
    path: "/avtozapchasti-belarus",
    queries: ["запчасти беларусь", "запчасти бай"],
    title: "Автозапчасти в Беларуси",
    description:
      "Заявка на автозапчасти для заказчиков из Беларуси. Компания в Бресте, телефон по стране бесплатный. Срок доставки по городам не опубликован.",
    h1: "Автозапчасти в Беларуси",
    intro:
      "EUROPART принимает заявки на автозапчасти от заказчиков из Беларуси. Это не сеть городских складов: юридическая точка и самовывоз подтверждены в Бресте, а телефон доступен по стране.",
    body: [
      "Запрос вроде «запчасти бай» относится к покупке в Беларуси, а не к отдельному магазину. Отдельные посадочные под чужие площадки не делаются.",
      "Срок и стоимость доставки в конкретный город не указаны, потому что курьерская служба новой платформы не подтверждена. Нельзя обещать день привоза в Минск, Гомель или другой город.",
    ],
    advantages: [
      "Один бесплатный номер на всю Беларусь.",
      "Заявка по VIN не требует визита в Брест.",
      "Самовывоз описан только там, где есть адрес.",
      "Городские страницы без собственных фактов закрыты от индексации.",
    ],
    orderNote:
      "В комментарии укажите город, если он важен для связи. Это пожелание к менеджеру, а не подтверждённый тариф доставки.",
    faq: [
      {
        question: "Как осуществляется доставка по Беларуси?",
        answer:
          "Условия доставки по городам на новой платформе не опубликованы. Подтверждён самовывоз в Бресте. Срок привоза в другой город на сайте не называется.",
      },
      {
        question: "Нужно ли жить в Бресте, чтобы оставить заявку?",
        answer:
          "Нет. Форма и телефон доступны заказчикам из Беларуси. Выдача по подтверждённому адресу при этом находится в Бресте.",
      },
      {
        question: "Почему нет отдельной страницы на каждый город?",
        answer:
          "Город без собственного адреса, срока и ассортимента повторял бы один и тот же текст. Такие страницы не открываются для поиска.",
      },
      {
        question: "Куда звонить из другого города Беларуси?",
        answer: `На ${company.phoneDisplay}. ${company.phoneNote}.`,
      },
    ],
    emptyTitle: "Общий список пока без карточек",
    emptyDescription:
      "География заявки не добавляет товар. Карточки появятся после публикации ассортимента.",
    assortment: { kind: "all" },
    policy: "editorial",
    defaultIndex: true,
    links: [
      { href: "/avtozapchasti", anchor: "Основной раздел автозапчастей" },
      { href: "/magazin-avtozapchastey", anchor: "Самовывоз в Бресте" },
      { href: "/kupit-zapchasti", anchor: "Порядок заявки" },
      { href: "/vin-search", anchor: "Отправить VIN из своего города" },
    ],
  },
  {
    slug: "avtozapchasti-minsk",
    path: "/avtozapchasti-minsk",
    queries: ["запчасти минск"],
    title: "Запчасти для заказчиков из Минска",
    description:
      "Точки EUROPART в Минске нет. Заявку на запчасть принимают по телефону и через форму VIN. Самовывоз подтверждён только в Бресте.",
    h1: "Запчасти для заказчиков из Минска",
    intro:
      "Отдельного магазина EUROPART в Минске нет. На странице нет минского адреса, пункта выдачи и срока доставки: этих данных у компании на сайте нет.",
    body: [
      "Заказчик из Минска пользуется общей заявкой. Менеджер видит телефон и комментарий, но страница не превращает это в обещание привезти деталь в Минск к дате.",
      "Пока здесь не появится подтверждённый минский пункт или опубликованное условие доставки, страница закрыта от индексации и не входит в карту сайта.",
    ],
    advantages: [
      "Нет выдуманного адреса в Минске.",
      "Тот же телефон и форма, что у остальной Беларуси.",
      "Самовывоз не переносится из Бреста в Минск.",
      "Индексация выключена, пока нет собственных фактов.",
    ],
    orderNote:
      "Если пишете из Минска, укажите это в комментарии к VIN. Способ передачи детали менеджер сможет обсудить только после того, как условия доставки будут подтверждены.",
    faq: [
      {
        question: "Есть ли магазин EUROPART в Минске?",
        answer: "Нет. Подтверждённый адрес только один: Брест, ул. Московская, 364.",
      },
      {
        question: "Можно ли забрать заказ в Минске?",
        answer: "Пункт выдачи в Минске не опубликован. Самовывоз подтверждён в Бресте.",
      },
      {
        question: "Заявку из Минска вообще принимают?",
        answer:
          "Да, по телефону и через форму VIN. Приём заявки не означает опубликованный срок доставки.",
      },
      {
        question: "Когда страница попадёт в поиск?",
        answer:
          "После того как для Минска появится собственное подтверждённое условие, а не замена названия города в общем тексте.",
      },
    ],
    emptyTitle: "Минского ассортимента на сайте нет",
    emptyDescription: "Город в адресе заявки не создаёт отдельный склад.",
    assortment: { kind: "all" },
    policy: "editorial",
    defaultIndex: false,
    links: [
      { href: "/avtozapchasti-belarus", anchor: "Заявки по Беларуси" },
      { href: "/magazin-avtozapchastey", anchor: "Единственный подтверждённый адрес" },
      { href: "/kupit-zapchasti", anchor: "Как отправить заявку" },
    ],
  },
  {
    slug: "avtozapchasti-gomel",
    path: "/avtozapchasti-gomel",
    queries: ["запчасти гомель"],
    title: "Запчасти для заказчиков из Гомеля",
    description:
      "Точки EUROPART в Гомеле нет, срок доставки в Гомель не опубликован. Заявку можно оставить по телефону или VIN, самовывоз — в Бресте.",
    h1: "Запчасти для заказчиков из Гомеля",
    intro:
      "Для Гомеля у EUROPART нет ни адреса выдачи, ни опубликованного тарифа доставки. Страница нужна, чтобы прямо сказать это, а не чтобы собрать запрос заменой города.",
    body: [
      "Заявку из Гомеля можно отправить тем же способом, что и из любого другого города Беларуси. Ответ менеджера не создаёт гомельский склад.",
      "Поиск эту страницу не индексирует. В карту сайта она попадёт только если индекс откроют после появления отдельного подтверждённого условия для Гомеля.",
    ],
    advantages: [
      "Гомель не назван магазином.",
      "Срок привоза в Гомель не выдуман.",
      "Заявка по VIN доступна без местной точки.",
      "Страница не конкурирует в поиске с общей страницей по Беларуси.",
    ],
    orderNote:
      "Город имеет смысл указать в комментарии. Это сведения для связи, не маршрут доставки.",
    faq: [
      {
        question: "Есть ли пункт EUROPART в Гомеле?",
        answer: "Нет. Адрес выдачи, который можно проверить, находится в Бресте.",
      },
      {
        question: "Сколько едет запчасть в Гомель?",
        answer: "Срок не опубликован. Называть количество дней было бы выдумкой.",
      },
      {
        question: "Чем страница Гомеля отличается от минской?",
        answer:
          "Ни одна из них не описывает местную точку. Тексты разные, потому что и Минск, и Гомель закрыты от индексации по одной причине: нет собственных фактов.",
      },
      {
        question: "Куда отправить VIN из Гомеля?",
        answer:
          "В общую форму заявки или на телефон компании. Отдельного гомельского номера нет.",
      },
    ],
    emptyTitle: "Отдельного гомельского списка нет",
    emptyDescription: "Опубликованные товары не делятся по городам.",
    assortment: { kind: "all" },
    policy: "editorial",
    defaultIndex: false,
    links: [
      { href: "/avtozapchasti-belarus", anchor: "Общие условия по стране" },
      { href: "/magazin-avtozapchastey", anchor: "Адрес самовывоза" },
      { href: "/vin-search", anchor: "Заявка без визита в Гомель" },
    ],
  },
  {
    slug: "zapchasti-audi",
    path: "/zapchasti-audi",
    queries: ["запчасти ауди"],
    title: "Запчасти Audi",
    description:
      "Запчасти Audi из опубликованного каталога EUROPART. Если позиции нет в списке, совместимость проверяют по VIN или артикулу.",
    h1: "Запчасти Audi",
    intro:
      "Здесь собираются опубликованные запчасти Audi: по марке автомобиля в совместимости или по категории Audi. Легковые детали других марок в этот список не подмешиваются.",
    body: [
      "Пока в базе нет такой опубликованной позиции, страница честно пустая и закрыта от поиска. Написать «в наличии для Audi» без карточки нельзя.",
      "VIN Audi можно отправить в общую форму. Это просьба проверить деталь, а не доказательство, что она уже лежит в каталоге.",
    ],
    advantages: [
      "В списке только товары с совместимостью Audi или категорией Audi.",
      "Пустой список не индексируется.",
      "Артикул Audi можно передать в заявку.",
      "Цена появляется только из предложения.",
    ],
    orderNote:
      "Для Audi полезны VIN, модель и оригинальный номер. Год помогает, но не заменяет артикул.",
    faq: [
      {
        question: "Вы продаёте запчасти Audi, если список пуст?",
        answer:
          "Страница не подтверждает продажу конкретной детали без карточки. Заявку отправить можно, наличие текстом не заявляется.",
      },
      {
        question: "Попадут ли сюда запчасти других марок?",
        answer:
          "Нет. Отбор идёт по марке Audi в подтверждённой совместимости или по категории с адресом Audi.",
      },
      {
        question: "Как открыть страницу для поиска?",
        answer:
          "Достаточно опубликовать хотя бы одну подходящую позицию. До этого адрес отдаёт noindex и не включается в sitemap.",
      },
      {
        question: "Можно ли проверить деталь Audi по артикулу?",
        answer:
          "Да, артикул указывается в заявке. Совпадение с автомобилем подтверждает менеджер.",
      },
    ],
    emptyTitle: "Опубликованных запчастей Audi нет",
    emptyDescription:
      "Когда появится карточка с совместимостью Audi, она будет показана здесь.",
    assortment: {
      kind: "vehicle",
      brandSlugs: ["audi"],
      categorySlugs: ["audi", "zapchasti-audi"],
    },
    policy: "needs-products",
    defaultIndex: true,
    links: [
      { href: "/avtozapchasti", anchor: "Все автозапчасти" },
      { href: "/vin-search", anchor: "Проверить Audi по VIN" },
      { href: "/brands", anchor: "Справочник марок" },
      { href: "/katalog-zapchastey", anchor: "Как устроены разделы" },
    ],
  },
  {
    slug: "zapchasti-mtz",
    path: "/zapchasti-mtz",
    queries: ["запчасти мтз"],
    title: "Запчасти МТЗ",
    description:
      "Раздел МТЗ не заявляет продажу, пока в каталоге нет опубликованных позиций. Подбор другой детали — по VIN или артикулу.",
    h1: "Запчасти МТЗ",
    intro:
      "Запчасти МТЗ не выставлены на продажу, пока в каталоге нет опубликованной позиции этой техники. Легковой ассортимент вместо тракторного здесь не показывается.",
    body: [
      "Отбор ограничен маркой или категорией МТЗ. Если таких строк в базе нет, страница остаётся пустой. Это ожидаемое состояние, а не ошибка загрузки.",
      "Индексировать пустой тракторный раздел нельзя: запрос есть, а предложения компании нет. Форма VIN остаётся для других автомобилей, но не подтверждает работу с МТЗ.",
    ],
    advantages: [
      "Нет заявления «продаём МТЗ» без карточек.",
      "Чужой легковой товар в блок не попадает.",
      "Страница закрыта от поиска, пока список пуст.",
      "Артикул можно отправить только как вопрос менеджеру.",
    ],
    orderNote:
      "Не оставляйте заявку на МТЗ в расчёте на готовый склад. Сначала должна появиться опубликованная позиция, либо менеджер отдельно подтвердит, что деталь берут в работу.",
    faq: [
      {
        question: "EUROPART продаёт запчасти МТЗ?",
        answer:
          "Только если ниже есть опубликованные карточки. Без них продажа запчастей МТЗ не заявляется.",
      },
      {
        question: "Почему на странице нет тракторных деталей «для примера»?",
        answer:
          "Пример был бы выдуманным ассортиментом. Показываются только реальные опубликованные товары.",
      },
      {
        question: "Можно ли прислать номер детали МТЗ?",
        answer:
          "Номер можно написать менеджеру, но ответ не обещан ассортиментом этой страницы.",
      },
      {
        question: "Когда раздел попадёт в Яндекс и Google?",
        answer: "После публикации хотя бы одной позиции МТЗ. До этого стоит noindex.",
      },
    ],
    emptyTitle: "Позиций МТЗ в каталоге нет",
    emptyDescription: "Продажа запчастей МТЗ не заявлена.",
    assortment: {
      kind: "vehicle",
      brandSlugs: ["mtz"],
      categorySlugs: ["mtz", "zapchasti-mtz"],
    },
    policy: "needs-products",
    defaultIndex: true,
    links: [
      { href: "/avtozapchasti", anchor: "Легковые автозапчасти" },
      { href: "/vin-search", anchor: "Заявка по номеру детали" },
      { href: "/catalog", anchor: "Что уже опубликовано" },
    ],
  },
  {
    slug: "bu-zapchasti",
    path: "/bu-zapchasti",
    queries: ["запчасти бу", "б у запчасти", "купить запчасти бу"],
    title: "Б/у автозапчасти",
    description:
      "Б/у позиции показываются только если товар опубликован со состоянием «б/у». Пока таких карточек нет, продажа б/у не заявлена.",
    h1: "Б/у автозапчасти",
    intro:
      "Б/у запчасти выводятся только из товаров со состоянием «б/у». Запросы «купить б/у» и «б у запчасти» относятся сюда же. Второго адреса с тем же смыслом нет: он перенаправляется на эту страницу.",
    body: [
      "Если карточек нет, EUROPART не продаёт б/у детали и не ставит цену «от». Новые опубликованные товары в этот список не попадают, чтобы не изображать разборку.",
      "Пока ассортимент пуст, страница закрыта от индексации. Открывать её в поиск ради частотности запроса нельзя.",
    ],
    advantages: [
      "Состояние берётся из карточки, а не из заголовка страницы.",
      "Новые детали не маскируются под б/у.",
      "Нет чужих логотипов разборок и досок объявлений.",
      "Пустой раздел не индексируется.",
    ],
    orderNote:
      "Заявка на новую деталь отправляется с основной страницы покупки. Для б/у нужен уже опубликованный товар с этим состоянием.",
    faq: [
      {
        question: "Можно ли купить б/у запчасть сейчас?",
        answer:
          "Только если в списке есть карточка со состоянием «б/у». Без неё покупка б/у не предлагается.",
      },
      {
        question: "Почему новая деталь не показана как замена?",
        answer:
          "У новой и б/у детали разный спрос. Смешивать их на одной витрине означало бы скрыть состояние.",
      },
      {
        question: "Есть ли разборка EUROPART?",
        answer:
          "Отдельная разборка на сайте не описана. Б/у товар может появиться только как опубликованная карточка.",
      },
      {
        question: "Куда делся адрес «купить б/у запчасти»?",
        answer:
          "Он постоянно перенаправляет сюда, чтобы два одинаковых текста не соперничали в поиске.",
      },
    ],
    emptyTitle: "Б/у товаров не опубликовано",
    emptyDescription: "Продажа б/у запчастей не заявлена.",
    assortment: { kind: "condition", condition: "USED" },
    policy: "needs-products",
    defaultIndex: true,
    links: [
      { href: "/kupit-zapchasti", anchor: "Заявка на новую деталь" },
      { href: "/avtozapchasti", anchor: "Опубликованный ассортимент" },
      { href: "/vin-search", anchor: "Спросить деталь по VIN" },
    ],
  },
];

const bySlug = new Map(landingDefinitions.map((item) => [item.slug, item]));

export function isLandingSlug(value: string): value is LandingSlug {
  return bySlug.has(value as LandingSlug);
}

export function getLanding(slug: string): LandingDefinition | null {
  return bySlug.get(slug as LandingSlug) ?? null;
}

export function fullTitle(title: string): string {
  return `${title} — ${company.brand}`;
}

function paragraphs(value: string): string[] {
  return value
    .split(/\n\s*\n/)
    .map((part) => part.trim())
    .filter(Boolean);
}

export function resolveLanding(
  definition: LandingDefinition,
  override: LandingOverride | null,
  productCount: number,
): ResolvedLanding {
  const published = override?.published ?? true;
  let indexable = definition.defaultIndex;
  if (definition.policy === "needs-products" && productCount < 1) {
    indexable = false;
  }
  if (override?.indexable === true) {
    indexable = definition.policy === "needs-products" ? productCount > 0 : true;
  }
  if (override?.indexable === false || !published) {
    indexable = false;
  }

  return {
    slug: definition.slug,
    path: definition.path,
    queries: definition.queries,
    title: override?.title || definition.title,
    description: override?.description || definition.description,
    h1: override?.h1 || definition.h1,
    intro: override?.intro || definition.intro,
    body: override?.body ? paragraphs(override.body) : definition.body,
    advantages: definition.advantages,
    orderNote: definition.orderNote,
    faq: override?.faq ?? definition.faq,
    emptyTitle: definition.emptyTitle,
    emptyDescription: definition.emptyDescription,
    assortment: definition.assortment,
    canonicalPath: override?.canonicalPath || definition.path,
    indexable,
    published,
    links: definition.links,
    relatedProductSlugs: override?.relatedProductSlugs ?? [],
    relatedCategorySlugs: override?.relatedCategorySlugs ?? [],
  };
}

export function visibleLinks(
  landing: ResolvedLanding,
  indexableSlugs: ReadonlySet<LandingSlug>,
): LandingLink[] {
  return landing.links.filter(
    (link) => !link.whenIndexable || indexableSlugs.has(link.whenIndexable),
  );
}

export function defaultEditorialLinks(): Array<{ href: string; anchor: string }> {
  return landingDefinitions
    .filter((item) => item.policy === "editorial" && item.defaultIndex)
    .map((item) => ({ href: item.path, anchor: item.h1 }));
}

export function parseFaqText(value: string): FaqItem[] {
  const blocks = value
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean);
  if (blocks.length > 8) {
    throw new Error("Вопросов может быть не больше восьми.");
  }
  return blocks.map((block) => {
    const [question, ...rest] = block.split("\n");
    const answer = rest.join("\n").trim();
    if (!question?.trim() || !answer) {
      throw new Error(
        "Каждый вопрос отделите пустой строкой и напишите ответ со следующей строки.",
      );
    }
    if (question.trim().length > 180 || answer.length > 800) {
      throw new Error("Вопрос до 180 знаков, ответ до 800.");
    }
    return { question: question.trim(), answer };
  });
}

export function formatFaqText(items: FaqItem[]): string {
  return items.map((item) => `${item.question}\n${item.answer}`).join("\n\n");
}
