import type { PageFaq, SeoPage } from "../types.ts";
import { partCategoryBySlug } from "./categories.ts";
import { catalogModels, type CatalogModel } from "./models.ts";

export type CatalogDraft = {
  path: string;
  status: "draft";
  reason: string;
};

const catalogPath = "/avtozapchasti/";

function modelPath(model: CatalogModel): string {
  return `/avtozapchasti/${model.brandSlug}/${model.slug}/`;
}

function partPath(model: CatalogModel, slug: string): string {
  return `/avtozapchasti/${model.brandSlug}/${model.slug}/${slug}/`;
}

function generationPath(model: CatalogModel, code: string): string {
  return `/avtozapchasti/${model.brandSlug}/${model.slug}/${code}/`;
}

function titleFor(core: string): string {
  const branded = `${core} | USAPARTS`;
  return branded.length <= 68 ? branded : core;
}

function describe(head: string, tail: string): string {
  const full = `${head} ${tail}`;
  if (full.length <= 160) return full;
  const room = 160 - head.length - 1;
  return `${head} ${tail.slice(0, Math.max(room - 1, 0)).trimEnd()}…`;
}

function faqsForModel(model: CatalogModel): PageFaq[] {
  const generations = model.generations.map((item) => item.label).join(", ");
  return [
    {
      question: `Можно ли заказать запчасти для ${model.brand} ${model.name} из США?`,
      answer: `${model.note} Ищем новую или б/у деталь и до оплаты показываем конкретный вариант.`,
    },
    {
      question: `Как подобрать деталь на ${model.name} по VIN?`,
      answer: `VIN отделяет поколение и ревизию. Для ${model.name} ориентиры такие: ${generations}. Номер детали сверяем по коду, а не по имени модели.`,
    },
    {
      question: `Что прислать, если OEM уже известен?`,
      answer: `Артикул ускоряет поиск, но для ${model.name} VIN всё равно полезен: он подтверждает, что номер от этой ревизии.`,
    },
    {
      question: `Можно ли заказать б/у деталь на ${model.name}?`,
      answer: "Да. Б/у показываем с фото лота и известными повреждениями. Новой её не называем.",
    },
    {
      question: `Как считается доставка в Минск и по Беларуси?`,
      answer: "После выкупа в США доставка занимает от 15 до 30 дней. Выдача в Бресте или отправка транспортной компанией, в том числе в Минск. Точный срок называем в расчёте.",
    },
  ];
}

function faqsForPart(model: CatalogModel, name: string, ask: string): PageFaq[] {
  const part = name.toLowerCase();
  return [
    {
      question: `Как заказать ${part} для ${model.brand} ${model.name}?`,
      answer: `${model.note} В заявке нужны ${ask}.`,
    },
    {
      question: `Подойдёт ли ${part} от соседнего поколения ${model.name}?`,
      answer: `Для ${model.name} соседние поколения не смешиваем. ${model.generations.map((item) => `${item.label}: ${item.note}`).join(" ")}`,
    },
    {
      question: `Достаточно ли OEM, чтобы найти ${part} на ${model.name}?`,
      answer: "Полный номер ускоряет поиск. VIN нужен, когда у узла несколько ревизий.",
    },
    {
      question: `Почему у ${part} ${model.name} нет цены на странице?`,
      answer: "Нет витрины с ценой и остатком. Стоимость считаем по конкретной детали и фиксируем в договоре до оплаты.",
    },
    {
      question: `Б/у ${part} для ${model.name} называют новой?`,
      answer: "Нет. В предложении прямо написано, новая это позиция или б/у с разборки.",
    },
  ];
}

function whySection(): SeoPage["sections"][number] {
  return {
    heading: "Почему заказывают у USAPARTS",
    points: [
      "Подбор по VIN и OEM",
      "Новая деталь или б/у: состояние написано до оплаты",
      "Поиск позиции в США",
      "Проверка применимости до выкупа",
      "Доставка в Беларусь и выдача в Бресте",
      "Консультация до подтверждения заказа",
    ],
    paragraphs: ["Срок после выкупа в США — от 15 до 30 дней. Груз страхуем, цену фиксируем в договоре."],
  };
}

function orderSection(model: CatalogModel): SeoPage["sections"][number] {
  return {
    heading: "Как проходит заказ",
    paragraphs: [
      `Оставляете VIN или OEM и название детали для ${model.brand} ${model.name}. Мы показываем вариант, цену фиксируем в договоре, затем выкупаем позицию в США.`,
      "Доставка после выкупа занимает от 15 до 30 дней. Груз страхуем. Выдача в Бресте по записи или отправка по Беларуси.",
    ],
    points: ["Подбор по VIN и каталожному номеру", "Новая деталь или б/у, это пишем до оплаты", "Проверка применимости до выкупа"],
  };
}

function hubPages(): SeoPage[] {
  const brands = new Map<string, CatalogModel[]>();
  for (const model of catalogModels) {
    const list = brands.get(model.brandSlug) ?? [];
    list.push(model);
    brands.set(model.brandSlug, list);
  }
  return [...brands.entries()].map(([slug, models]) => {
    const brand = models[0]?.brand ?? slug;
    const path = `/avtozapchasti/${slug}/`;
    return {
      path,
      kind: "hub",
      title: titleFor(`Модели ${brand}: запчасти из США`),
      description: describe(`Модели ${brand} для заказа запчастей из США: ${models.map((item) => item.name).join(", ")}.`, "Подбор по VIN, доставка в Беларусь."),
      h1: `Модели ${brand}: запчасти из США`,
      lead: `Модели ${brand}, для которых принимаем заявки на новые и б/у детали с американского рынка. Номер сверяем по VIN.`,
      crumbs: [
        { name: "Главная", path: "/" },
        { name: "Каталог", path: catalogPath },
        { name: brand, path },
      ],
      sections: [
        {
          heading: "Какие модели есть в каталоге",
          paragraphs: models.map((model) => `${model.name}. ${model.note}`),
        },
      ],
      faq: [
        {
          question: `Детали ${brand} общие между моделями?`,
          answer: "Нет. Даже близкие модели сверяем отдельно. На странице модели написано, что именно нельзя смешивать.",
        },
      ],
      cards: models.map((model) => ({ href: modelPath(model), title: model.name, text: model.note })),
      related: [
        { name: "Каталог", path: catalogPath },
        { name: "Подбор по VIN", path: "/podbor-po-vin/" },
        { name: "Доставка", path: "/dostavka-iz-ssha/" },
      ],
      brand,
      serviceName: `Запчасти ${brand} из США`,
    };
  });
}

function modelPage(model: CatalogModel, published: Set<string>): SeoPage {
  const path = modelPath(model);
  const cards = model.priorities.map((slug) => {
    const category = partCategoryBySlug.get(slug);
    return {
      href: partPath(model, slug),
      title: category?.name ?? slug,
      text: category?.ask ?? "",
    };
  });
  return {
    path,
    kind: "model",
    title: titleFor(`Автозапчасти для ${model.brand} ${model.name} из США`),
    description: describe(
      `Автозапчасти для ${model.brand} ${model.name} из США.`,
      "Новые и б/у детали, подбор по VIN и OEM, доставка в Беларусь.",
    ),
    h1: `Автозапчасти для ${model.brand} ${model.name} из США`,
    lead: `Новые и б/у оригинальные запчасти для ${model.name}. Подбор по VIN, OEM и доставка в Беларусь.`,
    crumbs: [
      { name: "Главная", path: "/" },
      { name: "Каталог", path: catalogPath },
      { name: model.brand, path: `/avtozapchasti/${model.brandSlug}/` },
      { name: model.name, path },
    ],
    visual: model.body,
    brand: model.brand,
    modelName: model.name,
    sections: [
      {
        heading: "Что важно для этой модели",
        paragraphs: [model.note, "Поколения ниже сужают поиск. Каталога, который сам подтверждает совместимость каждой детали, на сайте нет: номер проверяем по VIN или OEM."],
      },
      whySection(),
      orderSection(model),
      {
        heading: "Предложения",
        paragraphs: ["Готовых карточек с ценой и наличием нет. Запрос уходит в подбор: присылаем конкретную новую или б/у позицию до оплаты."],
      },
    ],
    faq: faqsForModel(model),
    cards,
    fitment: {
      generations: model.generations.map((item) => ({
        label: item.label,
        href: item.publish && published.has(generationPath(model, item.code)) ? generationPath(model, item.code) : undefined,
      })),
      engines: model.engines,
    },
    related: [
      ...model.similar
        .map((key) => catalogModels.find((item) => `${item.brandSlug}/${item.slug}` === key))
        .filter((item): item is CatalogModel => Boolean(item))
        .map((item) => ({ name: `${item.brand} ${item.name}`, path: modelPath(item) })),
      { name: model.brand, path: `/avtozapchasti/${model.brandSlug}/` },
      { name: "Подбор по VIN", path: "/podbor-po-vin/" },
      { name: "Доставка", path: "/dostavka-iz-ssha/" },
    ],
    serviceName: `Запчасти ${model.brand} ${model.name} из США`,
  };
}

function partPage(model: CatalogModel, slug: string): SeoPage {
  const category = partCategoryBySlug.get(slug);
  const name = category?.h1 ?? slug;
  const path = partPath(model, slug);
  const siblings = model.priorities.filter((item) => item !== slug).slice(0, 4);
  return {
    path,
    kind: "part",
    title: titleFor(`${name} ${model.brand} ${model.name} из США`),
    description: describe(
      `${name} ${model.brand} ${model.name} из США.`,
      `Подбор по VIN: ${category?.ask ?? "номер узла"}. Доставка в Беларусь.`,
    ),
    h1: `${name} ${model.brand} ${model.name} из США`,
    lead: `${name} для ${model.name}: новая или б/у деталь из США. В заявке нужны ${category?.ask ?? "VIN и название узла"}.`,
    crumbs: [
      { name: "Главная", path: "/" },
      { name: "Каталог", path: catalogPath },
      { name: model.name, path: modelPath(model) },
      { name: category?.name ?? name, path },
    ],
    brand: model.brand,
    modelName: model.name,
    part: category?.name ?? name,
    sections: [
      {
        heading: "Как сужаем поиск",
        paragraphs: [
          model.note,
          category?.evOnly
            ? "Высоковольтный узел не объединяем с соседним компонентом. Батарея, инвертор и электромотор проверяются отдельно по году и ревизии."
            : "Одинаковое название детали у другого поколения не считаем совместимостью.",
        ],
      },
      whySection(),
      orderSection(model),
      {
        heading: "Предложения",
        paragraphs: ["Карточек с ценой и статусом склада нет. Форма ниже отправляет запрос на подбор этой категории."],
      },
    ],
    faq: faqsForPart(model, name, category?.ask ?? "VIN"),
    cards: siblings.map((item) => {
      const sibling = partCategoryBySlug.get(item);
      return { href: partPath(model, item), title: sibling?.name ?? item, text: sibling?.ask ?? "" };
    }),
    related: [
      { name: model.name, path: modelPath(model) },
      { name: "Подбор по VIN", path: "/podbor-po-vin/" },
      { name: "Доставка", path: "/dostavka-iz-ssha/" },
    ],
    serviceName: `${name} ${model.brand} ${model.name}`,
  };
}

function generationPage(model: CatalogModel, code: string): SeoPage {
  const generation = model.generations.find((item) => item.code === code);
  const path = generationPath(model, code);
  const label = generation?.label ?? code;
  return {
    path,
    kind: "generation",
    title: titleFor(`${model.brand} ${model.name} ${label} из США`),
    description: describe(
      `Запчасти ${model.brand} ${model.name} ${label} из США.`,
      generation?.note ?? "Подбор только внутри этого поколения.",
    ),
    h1: `Запчасти ${model.brand} ${model.name} ${label} из США`,
    lead: generation?.note ?? `Поколение ${label} для ${model.name}.`,
    crumbs: [
      { name: "Главная", path: "/" },
      { name: "Каталог", path: catalogPath },
      { name: model.name, path: modelPath(model) },
      { name: label, path },
    ],
    brand: model.brand,
    modelName: `${model.name} ${label}`,
    sections: [
      {
        heading: "Почему поколение отделено",
        paragraphs: [model.note, generation?.note ?? "Поколение отделено от соседних кузовов.", "Страницы «поколение + категория» не открыты: без подтверждённой совместимости они повторяли бы общий текст."],
      },
    ],
    faq: [
      {
        question: `Чем ${label} отличается при заказе ${model.brand} ${model.name}?`,
        answer: generation?.note ?? `Поколение ${label} сверяем отдельно от соседних кузовов.`,
      },
      {
        question: `Можно ли ставить детали другого поколения на ${model.name} ${label}?`,
        answer: model.note,
      },
      {
        question: `Какие категории открыты для ${model.name} ${label}?`,
        answer: "Открыты общие категории модели. Страницы «поколение и категория» не опубликованы: совместимость каждого узла не подтверждена отдельным каталогом.",
      },
      {
        question: `Как проверить деталь для ${model.name} ${label}?`,
        answer: "По VIN или OEM. Год в заявке помогает сузить поиск, но сам по себе не подтверждает номер детали.",
      },
    ],
    cards: model.priorities.slice(0, 6).map((slug) => {
      const category = partCategoryBySlug.get(slug);
      return { href: partPath(model, slug), title: category?.name ?? slug, text: "Общая категория модели, не отдельный фильтр поколения." };
    }),
    related: [
      { name: model.name, path: modelPath(model) },
      { name: "Подбор по VIN", path: "/podbor-po-vin/" },
    ],
    serviceName: `Запчасти ${model.brand} ${model.name} ${label}`,
  };
}

function catalogIndex(pages: SeoPage[]): SeoPage {
  const hubs = pages.filter((page) => page.kind === "hub");
  return {
    path: catalogPath,
    kind: "catalog",
    title: titleFor("Каталог запчастей по моделям из США"),
    description: "Каталог моделей USAPARTS: новые и б/у запчасти из США. Подбор по VIN и доставка в Беларусь, приоритет Минск.",
    h1: "Каталог запчастей по моделям",
    lead: "Сорок моделей, для которых можно оставить заявку. Цены и остатки появляются только в расчёте, не в виде витрины.",
    crumbs: [
      { name: "Главная", path: "/" },
      { name: "Каталог", path: catalogPath },
    ],
    sections: [
      {
        heading: "Как пользоваться каталогом",
        paragraphs: [
          "Откройте модель, затем категорию. Поколение и двигатель сужают запрос, но совместимость подтверждается VIN или OEM.",
          "Страницы без отдельного текста о поколении и категории в каталог не выпущены.",
        ],
      },
    ],
    faq: [
      {
        question: "Почему нет карточек товаров?",
        answer: "На сайте нет склада с ценами. Заявка запускает подбор конкретной детали.",
      },
    ],
    cards: hubs.map((hub) => ({ href: hub.path, title: hub.h1, text: hub.lead })),
    related: [
      { name: "Подбор по VIN", path: "/podbor-po-vin/" },
      { name: "Доставка", path: "/dostavka-iz-ssha/" },
      { name: "Автозапчасти из США", path: "/avtozapchasti-iz-ssha/" },
    ],
    serviceName: "Каталог моделей USAPARTS",
  };
}

export function buildCatalog(): { pages: SeoPage[]; drafts: CatalogDraft[] } {
  const drafts: CatalogDraft[] = [];
  const generationPaths = new Set<string>();
  for (const model of catalogModels) {
    for (const generation of model.generations) {
      const path = generationPath(model, generation.code);
      if (generation.publish) generationPaths.add(path);
      else drafts.push({ path, status: "draft", reason: "Поколение описано на странице модели. Отдельного текста для индексации нет." });
      for (const slug of model.priorities) {
        drafts.push({
          path: `${path}${slug}/`,
          status: "draft",
          reason: "Комбинация поколения и категории без подтверждённой совместимости не публикуется.",
        });
      }
    }
    for (const category of partCategoryBySlug.values()) {
      if (!model.priorities.includes(category.slug)) {
        drafts.push({
          path: partPath(model, category.slug),
          status: "draft",
          reason: "Категория не входит в приоритет модели. Общий текст без собственного угла не публикуем.",
        });
      }
    }
  }

  const published = new Set<string>(generationPaths);
  const models = catalogModels.map((model) => modelPage(model, published));
  const parts = catalogModels.flatMap((model) => model.priorities.map((slug) => partPage(model, slug)));
  const generations = catalogModels.flatMap((model) =>
    model.generations.filter((item) => item.publish).map((item) => generationPage(model, item.code)),
  );
  const hubs = hubPages();
  const index = catalogIndex(hubs);
  return { pages: [index, ...hubs, ...models, ...generations, ...parts], drafts };
}

export const { pages: catalogPages, drafts: catalogDrafts } = buildCatalog();
