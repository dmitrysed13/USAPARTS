import { mkdir, writeFile } from "node:fs/promises";
import { catalogDrafts, liveCategorySlugs } from "../src/seo/catalog/buildPages.ts";
import { partCategories } from "../src/seo/catalog/categories.ts";
import { catalogModels } from "../src/seo/catalog/models.ts";
import { pages } from "../src/seo/pages.ts";

function cell(value) {
  const text = String(value ?? "");
  if (/[",\n\r]/.test(text)) return `"${text.replaceAll('"', '""')}"`;
  return text;
}

function csv(rows) {
  return `${rows.map((row) => row.map(cell).join(",")).join("\n")}\n`;
}

const geo = "Минск | Беларусь | доставка по Беларуси | заказать в Беларусь";

const partQueries = {
  dvigatel: (brand, model) => [`двигатель ${brand} ${model} купить`, `двигатель ${brand} ${model}`],
  kpp: (brand, model) => [`АКПП ${brand} ${model}`, `коробка передач ${brand} ${model}`],
  kuzov: (brand, model) => [`капот ${brand} ${model}`, `дверь ${brand} ${model}`, `кузов ${brand} ${model}`],
  fary: (brand, model) => [`фара ${brand} ${model}`, `фары ${brand} ${model}`],
  bampery: (brand, model) => [`бампер ${brand} ${model}`],
  podveska: (brand, model) => [`подвеска ${brand} ${model}`],
  "tormoznaya-sistema": (brand, model) => [`тормоза ${brand} ${model}`],
  ohlazhdenie: (brand, model) => [`радиатор ${brand} ${model}`],
  elektrika: (brand, model) => [`электрика ${brand} ${model}`, `блок управления ${brand} ${model}`],
  salon: (brand, model) => [`салон ${brand} ${model}`, `сиденья ${brand} ${model}`],
  "stekla-i-zerkala": (brand, model) => [`стекло ${brand} ${model}`, `зеркало ${brand} ${model}`],
  batareya: (brand, model) => [`батарея ${brand} ${model}`, `высоковольтная батарея ${brand} ${model}`],
  elektrodvigatel: (brand, model) => [`электродвигатель ${brand} ${model}`],
  invertor: (brand, model) => [`инвертор ${brand} ${model}`],
};

const published = new Set(pages.map((page) => page.path));

const modelRows = [
  ["brand", "brand_slug", "model", "slug", "body", "path", "priorities", "engines", "generations", "similar", "note"],
  ...catalogModels.map((model) => [
    model.brand,
    model.brandSlug,
    model.name,
    model.slug,
    model.body,
    `/avtozapchasti/${model.brandSlug}/${model.slug}/`,
    model.priorities.join("|"),
    model.engines.join("|"),
    model.generations.map((item) => `${item.code}${item.publish ? ":published" : ":draft"}`).join("|"),
    model.similar.join("|"),
    model.note,
  ]),
];

const categoryRows = [
  ["slug", "name", "h1", "ask", "ev_only", "subcategories"],
  ...partCategories.map((item) => [item.slug, item.name, item.h1, item.ask, item.evOnly ? "yes" : "no", item.subcategories.join("|")]),
];

const landingRows = [
  ["path", "kind", "status", "robots", "title", "description", "h1", "canonical", "brand", "model"],
  ...pages.map((page) => [
    page.path,
    page.kind,
    "published",
    "index, follow",
    page.title,
    page.description,
    page.h1,
    page.path,
    page.brand ?? "",
    page.modelName ?? "",
  ]),
  ...catalogDrafts.map((draft) => [draft.path, "draft", "draft", "noindex", "", "", "", draft.path, "", ""]),
];

const clusters = [
  ["cluster_id", "intent", "queries", "geo_modifiers", "target_url", "draft_url", "status", "frequency"],
];

for (const model of catalogModels) {
  const target = `/avtozapchasti/${model.brandSlug}/${model.slug}/`;
  const queries = [
    `запчасти ${model.brand} ${model.name}`,
    `купить запчасти ${model.brand} ${model.name}`,
    `автозапчасти ${model.brand} ${model.name} из США`,
    `запчасти ${model.brand} ${model.name} по VIN`,
  ];
  clusters.push([`${model.brandSlug}-${model.slug}-model`, "model", queries.join(" | "), geo, target, "", "published", ""]);
  for (const category of partCategories) {
    const path = `${target}${category.slug}/`;
    const maker = partQueries[category.slug];
    const list = maker(model.brand, model.name);
    list.push(`${list[0]} {год}`);
    const live = liveCategorySlugs(model).includes(category.slug);
    clusters.push([
      `${model.brandSlug}-${model.slug}-${category.slug}`,
      "part",
      list.join(" | "),
      geo,
      live ? path : target,
      live ? "" : path,
      live ? "published" : "draft",
      "",
    ]);
  }
  for (const generation of model.generations.filter((item) => item.publish)) {
    clusters.push([
      `${model.brandSlug}-${model.slug}-${generation.code}`,
      "generation",
      `запчасти ${model.brand} ${model.name} ${generation.label}`,
      geo,
      `${target}${generation.code}/`,
      "",
      "published",
      "",
    ]);
  }
}

await mkdir("seo", { recursive: true });
await writeFile("seo/car_models.csv", csv(modelRows));
await writeFile("seo/part_categories.csv", csv(categoryRows));
await writeFile("seo/landing_pages.csv", csv(landingRows));
await writeFile("seo/keyword_clusters.csv", csv(clusters));
console.log(
  `seo csv: ${catalogModels.length} models, ${pages.length} published, ${catalogDrafts.length} drafts, ${clusters.length - 1} clusters, published paths ${published.size}`,
);
