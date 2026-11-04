import type { SeoPage } from "../types.ts";
import { partCategoryBySlug } from "./categories.ts";
import { generationStory, partCopy } from "./copy.ts";
import { catalogModels, type CatalogModel } from "./models.ts";

const requiredCategories = ["tormoznaya-sistema", "stekla-i-zerkala"];

export function liveCategorySlugs(model: CatalogModel): string[] {
  return [...model.priorities, ...requiredCategories.filter((slug) => !model.priorities.includes(slug))];
}

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

function faqsForModel(model: CatalogModel): SeoPage["faq"] {
  const generations = model.generations.map((item) => item.label).join(", ");
  const name = `${model.brand} ${model.name}`;
  return [
    {
      question: `Можно ли заказать запчасти для ${name} из США?`,
      answer: `${model.note} Для ${model.name} ищем новую или б/у деталь и до оплаты показываем конкретный вариант.`,
    },
    {
      question: `Как подобрать деталь на ${model.name} по VIN?`,
      answer: `VIN отделяет поколение и ревизию ${model.name}. Ориентиры такие: ${generations}. Номер детали сверяем по коду, а не по имени модели.`,
    },
    {
      question: `Что прислать, если OEM на ${model.name} уже известен?`,
      answer: `Артикул ускоряет поиск ${model.name}, но VIN всё равно полезен: он подтверждает, что номер от этой ревизии.`,
    },
    {
      question: `Можно ли заказать б/у деталь на ${model.name}?`,
      answer: `Да, для ${model.name} тоже. Б/у показываем с фото лота и известными повреждениями. Новой её не называем.`,
    },
    {
      question: `Как считается доставка ${model.name} в Минск и по Беларуси?`,
      answer: `Для ${model.name} после выкупа в США доставка занимает от 15 до 30 дней. Выдача в Бресте или отправка по Беларуси, в том числе в Минск.`,
    },
  ];
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
          answer: `Нет. У ${brand} даже близкие модели сверяем отдельно. На странице модели написано, что именно нельзя смешивать.`,
        },
      ],
      cards: models.map((model) => ({ href: modelPath(model), title: model.name, text: model.note })),
      related: [
        { name: "Каталог", path: catalogPath },
        ...(["ford", "chevrolet", "dodge", "jeep", "tesla", "cadillac", "gmc"].includes(slug)
          ? [{ name: `Обзор ${brand}`, path: `/${slug}/` }]
          : []),
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
  const cards = liveCategorySlugs(model).map((slug) => {
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
        heading: `Что важно для ${model.name}`,
        paragraphs: [
          model.note,
          `Поколения ${model.name}: ${model.generations.map((item) => item.label).join(", ")}. Номер детали сверяем по VIN или OEM, не по названию поколения.`,
        ],
      },
      {
        heading: `Как заказать деталь для ${model.name}`,
        paragraphs: [
          `В заявке на ${model.brand} ${model.name} нужны VIN или OEM и название узла. Новую и б/у позицию показываем до оплаты и не подменяем одну другой.`,
          `После выкупа в США доставка для ${model.name} занимает от 15 до 30 дней. Выдача в Бресте или отправка по Беларуси.`,
        ],
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
      ...model.generations
        .filter((item) => item.publish)
        .map((item) => ({ name: `${model.name} ${item.label}`, path: generationPath(model, item.code) })),
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
  const copy = category ? partCopy(model, category) : null;
  const siblings = liveCategorySlugs(model).filter((item) => item !== slug);
  const sameBrand = catalogModels
    .filter((item) => item.brandSlug === model.brandSlug && item.slug !== model.slug && liveCategorySlugs(item).includes(slug))
    .slice(0, 2);
  return {
    path,
    kind: "part",
    title: titleFor(`${name} ${model.brand} ${model.name} из США`),
    description: describe(copy?.description ?? `${name} ${model.brand} ${model.name} из США.`, "Подбор по VIN."),
    h1: `${name} ${model.brand} ${model.name} из США`,
    lead: copy?.lead ?? `${name} для ${model.name}.`,
    crumbs: [
      { name: "Главная", path: "/" },
      { name: "Каталог", path: catalogPath },
      { name: model.brand, path: `/avtozapchasti/${model.brandSlug}/` },
      { name: model.name, path: modelPath(model) },
      { name: category?.name ?? name, path },
    ],
    brand: model.brand,
    modelName: model.name,
    part: category?.name ?? name,
    sections: copy?.sections ?? [],
    faq: copy?.faq ?? [],
    cards: siblings.map((item) => {
      const sibling = partCategoryBySlug.get(item);
      return { href: partPath(model, item), title: sibling?.name ?? item, text: `Смежная категория ${model.name}` };
    }),
    related: [
      { name: model.name, path: modelPath(model) },
      ...model.generations
        .filter((item) => item.publish)
        .map((item) => ({ name: `${model.name} ${item.label}`, path: generationPath(model, item.code) })),
      ...sameBrand.map((item) => ({ name: `${name} ${item.name}`, path: partPath(item, slug) })),
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
  const story = generation ? generationStory(model, generation) : null;
  return {
    path,
    kind: "generation",
    title: story?.title ?? titleFor(`${model.brand} ${model.name} ${label} из США`),
    description: story?.description ?? describe(`Запчасти ${model.brand} ${model.name} ${label} из США.`, "Подбор по VIN."),
    h1: story?.h1 ?? `Запчасти ${model.brand} ${model.name} ${label} из США`,
    lead: story?.lead ?? `Поколение ${label} для ${model.name}.`,
    crumbs: [
      { name: "Главная", path: "/" },
      { name: "Каталог", path: catalogPath },
      { name: model.brand, path: `/avtozapchasti/${model.brandSlug}/` },
      { name: model.name, path: modelPath(model) },
      { name: label, path },
    ],
    brand: model.brand,
    modelName: `${model.name} ${label}`,
    sections: story?.sections ?? [],
    faq: story?.faq ?? [],
    cards: liveCategorySlugs(model).map((slug) => {
      const category = partCategoryBySlug.get(slug);
      return { href: partPath(model, slug), title: category?.name ?? slug, text: `Категория ${model.name}, номер всё равно сверяем по VIN` };
    }),
    related: [
      { name: model.name, path: modelPath(model) },
      { name: model.brand, path: `/avtozapchasti/${model.brandSlug}/` },
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
      for (const slug of liveCategorySlugs(model)) {
        drafts.push({
          path: `${path}${slug}/`,
          status: "draft",
          reason: "Комбинация поколения и категории без подтверждённой совместимости не публикуется.",
        });
      }
    }
    for (const category of partCategoryBySlug.values()) {
      if (!liveCategorySlugs(model).includes(category.slug)) {
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
  const parts = catalogModels.flatMap((model) => liveCategorySlugs(model).map((slug) => partPage(model, slug)));
  const generations = catalogModels.flatMap((model) =>
    model.generations.filter((item) => item.publish).map((item) => generationPage(model, item.code)),
  );
  const hubs = hubPages();
  const index = catalogIndex(hubs);
  return { pages: [index, ...hubs, ...models, ...generations, ...parts], drafts };
}

export const { pages: catalogPages, drafts: catalogDrafts } = buildCatalog();
