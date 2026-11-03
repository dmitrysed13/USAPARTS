import assert from "node:assert/strict";
import { test } from "node:test";
import { catalogDrafts } from "./catalog/buildPages.ts";
import { partCategories } from "./catalog/categories.ts";
import { catalogModels } from "./catalog/models.ts";
import { pages } from "./pages.ts";
import { pageGraph } from "./schema.ts";

const paths = new Set(pages.map((page) => page.path));

test("catalog has 40 models and only real internal links", () => {
  assert.equal(catalogModels.length, 40);
  assert.equal(new Set(catalogModels.map((model) => `${model.brandSlug}/${model.slug}`)).size, 40);
  for (const model of catalogModels) {
    assert.ok(model.priorities.length >= 5 && model.priorities.length <= 10, model.name);
    for (const slug of model.priorities) {
      assert.ok(partCategories.some((item) => item.slug === slug), slug);
      assert.ok(paths.has(`/avtozapchasti/${model.brandSlug}/${model.slug}/${slug}/`));
    }
    for (const key of model.similar) {
      assert.ok(catalogModels.some((item) => `${item.brandSlug}/${item.slug}` === key), key);
    }
    assert.ok(paths.has(`/avtozapchasti/${model.brandSlug}/${model.slug}/`));
  }
  for (const page of pages) {
    for (const card of page.cards ?? []) assert.ok(paths.has(card.href), `${page.path} -> ${card.href}`);
  }
});

test("thin generation and category combinations stay drafts", () => {
  assert.ok(paths.has("/avtozapchasti/bmw/x3/g01/"));
  assert.ok(paths.has("/avtozapchasti/bmw/x5/g05/"));
  assert.ok(paths.has("/avtozapchasti/volkswagen/jetta/mk7/"));
  assert.equal(paths.has("/avtozapchasti/bmw/x3/f25/"), false);
  assert.equal(paths.has("/avtozapchasti/bmw/x3/g01/fary/"), false);
  for (const draft of catalogDrafts) assert.equal(paths.has(draft.path), false, draft.path);
  const passat = pages.find((page) => page.path === "/avtozapchasti/volkswagen/passat/");
  assert.ok(passat?.h1.includes("NMS"));
  const escape = catalogModels.find((model) => model.slug === "escape");
  assert.match(escape?.note ?? "", /Kuga/);
  assert.ok(catalogModels.some((model) => model.slug === "encore"));
  assert.ok(catalogModels.some((model) => model.slug === "encore-gx"));
});

test("electric models keep high-voltage parts separate", () => {
  for (const slug of ["id4", "model-3", "model-y"]) {
    const model = catalogModels.find((item) => item.slug === slug);
    assert.ok(model?.priorities.includes("batareya"));
    assert.ok(model?.priorities.includes("invertor"));
    assert.ok(model?.priorities.includes("elektrodvigatel"));
  }
  const camry = catalogModels.find((model) => model.slug === "camry");
  assert.equal(camry?.priorities.includes("batareya"), false);
});

test("generation pages are linked and category copy is not one shared block", () => {
  for (const path of ["/avtozapchasti/volkswagen/jetta/mk7/", "/avtozapchasti/bmw/x3/g01/", "/avtozapchasti/bmw/x5/g05/"]) {
    const page = pages.find((item) => item.path === path);
    assert.ok(page);
    assert.ok(page.sections.length >= 3);
    assert.equal(page.sections.some((section) => section.heading === "Почему заказывают у USAPARTS"), false);
  }
  const jetta = pages.find((page) => page.path === "/avtozapchasti/volkswagen/jetta/");
  assert.ok(jetta?.related.some((link) => link.path === "/avtozapchasti/volkswagen/jetta/mk7/"));
  const x3brakes = pages.find((page) => page.path === "/avtozapchasti/bmw/x3/tormoznaya-sistema/");
  assert.ok(x3brakes?.related.some((link) => link.path === "/avtozapchasti/bmw/x3/g01/"));
  assert.match(x3brakes?.h1 ?? "", /Тормозная система BMW X3/);
  const fusionGlass = pages.find((page) => page.path === "/avtozapchasti/ford/fusion/stekla-i-zerkala/");
  assert.match(fusionGlass?.title ?? "", /Стёкла и зеркала Ford Fusion/);
  for (const model of catalogModels) {
    assert.ok(paths.has(`/avtozapchasti/${model.brandSlug}/${model.slug}/tormoznaya-sistema/`));
    assert.ok(paths.has(`/avtozapchasti/${model.brandSlug}/${model.slug}/stekla-i-zerkala/`));
  }
  assert.equal(paths.has("/avtozapchasti/bmw/x3/tormoza/"), false);
  const seen = new Map<string, string>();
  for (const page of pages.filter((item) => item.kind === "model" || item.kind === "part" || item.kind === "generation")) {
    const texts = new Set([page.lead, ...page.sections.flatMap((section) => section.paragraphs), ...page.faq.map((item) => item.answer)]);
    for (const text of texts) {
      const previous = seen.get(text);
      assert.equal(previous, undefined, `${text.slice(0, 80)} on ${previous} and ${page.path}`);
      seen.set(text, page.path);
    }
  }
});

test("catalog schema has no invented offers", () => {
  const page = pages.find((item) => item.path === "/avtozapchasti/ford/mustang/");
  assert.ok(page);
  const graph = pageGraph(page);
  const types = graph["@graph"].map((node) => node["@type"]);
  assert.ok(types.includes("CollectionPage"));
  assert.ok(types.includes("BreadcrumbList"));
  assert.ok(types.includes("FAQPage"));
  assert.equal(types.includes("Product"), false);
  assert.equal(types.includes("Offer"), false);
  assert.equal(types.includes("AggregateRating"), false);
  const text = JSON.stringify(pages.filter((item) => item.path.startsWith("/avtozapchasti/")));
  assert.equal(text.includes("★★"), false);
  assert.equal(text.includes("цена от"), false);
});
