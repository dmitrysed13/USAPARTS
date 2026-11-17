export type SeoTemplateKind =
  | "home"
  | "catalog"
  | "category"
  | "brand"
  | "model"
  | "generation"
  | "modification"
  | "engine"
  | "product"
  | "oem"
  | "partBrand"
  | "geo";

export type SeoTemplateVars = {
  category?: string;
  brand?: string;
  model?: string;
  generation?: string;
  modification?: string;
  engine?: string;
  name?: string;
  article?: string;
  partBrand?: string;
  condition?: string;
  oem?: string;
  geo?: string;
};

export type SeoTemplateResult = {
  title: string;
  description: string;
  h1: string;
};

function clean(value: string | undefined): string {
  return value?.trim() ?? "";
}

/** Templates from SEO_SPECIFICATION.md. City is never auto-injected into product titles. */
export function applySeoTemplate(
  kind: SeoTemplateKind,
  vars: SeoTemplateVars,
): SeoTemplateResult {
  const category = clean(vars.category);
  const brand = clean(vars.brand);
  const model = clean(vars.model);
  const name = clean(vars.name);
  const article = clean(vars.article);
  const partBrand = clean(vars.partBrand);
  const oem = clean(vars.oem);
  const geo = clean(vars.geo) || "Беларуси";

  switch (kind) {
    case "home":
      return {
        title: "EUROPART — европейские автозапчасти",
        description:
          "Европейские автозапчасти для Беларуси. Поиск по OEM и VIN. Цены и наличие — только по реальным предложениям.",
        h1: "EUROPART",
      };
    case "catalog":
      return {
        title: "Каталог автозапчастей — EUROPART",
        description:
          "Категории и марки с опубликованным ассортиментом. Пустые разделы не индексируются.",
        h1: "Каталог",
      };
    case "category":
      return {
        title: `${category} — купить в ${geo} | EUROPART`,
        description: `${category}: самовывоз в Бресте и доставка по Беларуси — при подтверждённых условиях. Наличие только по реальным предложениям.`,
        h1: category || "Категория",
      };
    case "brand":
      return {
        title: `Запчасти ${brand} — EUROPART`,
        description: `Подбор по моделям ${brand}. Наличие только по реальным предложениям.`,
        h1: brand ? `Запчасти для ${brand}` : "Запчасти",
      };
    case "model":
      return {
        title: `Запчасти ${brand} ${model} — EUROPART`.replace(/\s+/g, " ").trim(),
        description: `Модели и разделы ${brand} ${model}, в которых есть товары.`.replace(
          /\s+/g,
          " ",
        ),
        h1: `Запчасти ${brand} ${model}`.replace(/\s+/g, " ").trim(),
      };
    case "generation":
    case "modification":
    case "engine": {
      const label = [brand, model, vars.generation, vars.modification, vars.engine]
        .map(clean)
        .filter(Boolean)
        .join(" ");
      return {
        title: `Запчасти ${label} — EUROPART`,
        description: `Запчасти для ${label}. Показываем только опубликованный ассортимент.`,
        h1: `Запчасти ${label}`,
      };
    }
    case "product": {
      const titleBits = [name, article, partBrand ? `— ${partBrand}` : ""]
        .filter(Boolean)
        .join(" ");
      return {
        title: `${titleBits} | EUROPART`.replace(/\s+/g, " ").trim(),
        description:
          clean(vars.name) && article
            ? `${name}${article ? ` (${article})` : ""}${partBrand ? `, ${partBrand}` : ""}. Цена и наличие — только при реальном предложении.`
            : `${name || "Товар"} — EUROPART.`,
        h1: name || "Товар",
      };
    }
    case "oem":
      return {
        title: `OEM ${oem} — EUROPART`,
        description: `Товары с OEM ${oem}. Страница открывается только при реальных опубликованных позициях.`,
        h1: `OEM ${oem}`,
      };
    case "partBrand":
      return {
        title: `Запчасти ${partBrand} — EUROPART`,
        description: `Производитель ${partBrand}: категории с реальными предложениями.`,
        h1: partBrand ? `Запчасти ${partBrand}` : "Бренд",
      };
    case "geo":
      return {
        title: `Автозапчасти ${geo} — EUROPART`,
        description: `Автозапчасти с доставкой по ${geo}. Минск в шаблонах не подставляется автоматически.`,
        h1: `Автозапчасти ${geo}`,
      };
    default:
      return { title: "EUROPART", description: "", h1: "EUROPART" };
  }
}
