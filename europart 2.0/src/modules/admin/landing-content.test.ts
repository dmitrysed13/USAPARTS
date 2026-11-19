import { beforeEach, describe, expect, it } from "vitest";
import {
  readLandingEditor,
  resetLandingContent,
  saveLandingContent,
} from "@/modules/admin/landing-content";
import { loadLandingPage } from "@/modules/seo/landing-data";
import { formatFaqText, getLanding } from "@/modules/seo/landings";
import { resetCatalogTables } from "@/test/database";

beforeEach(async () => {
  await resetCatalogTables();
});

describe("landing editor", () => {
  it("replaces the public title and can return to the code copy", async () => {
    const definition = getLanding("kupit-zapchasti");
    expect(definition).not.toBeNull();
    const form = new FormData();
    form.set("h1", definition!.h1);
    form.set("title", "Заказ автозапчастей");
    form.set("description", definition!.description);
    form.set("intro", definition!.intro);
    form.set("body", definition!.body.join("\n\n"));
    form.set("faqText", formatFaqText(definition!.faq));
    form.set("canonicalPath", definition!.path);
    form.set("indexable", "inherit");
    form.set("published", "yes");
    form.set("relatedProductSlugs", "");
    form.set("relatedCategorySlugs", "");
    await saveLandingContent(definition!.slug, form);

    const edited = await loadLandingPage(definition!.slug);
    expect(edited?.landing.title).toBe("Заказ автозапчастей");
    expect(edited?.landing.indexable).toBe(true);

    await resetLandingContent(definition!.slug);
    const restored = await readLandingEditor(definition!.slug);
    expect(restored?.saved).toBeNull();
  });

  it("hides a landing without indexing it", async () => {
    const definition = getLanding("avtozapchasti")!;
    const form = new FormData();
    form.set("h1", definition.h1);
    form.set("title", definition.title);
    form.set("description", definition.description);
    form.set("intro", definition.intro);
    form.set("body", definition.body.join("\n\n"));
    form.set("faqText", formatFaqText(definition.faq));
    form.set("canonicalPath", definition.path);
    form.set("indexable", "no");
    form.set("published", "no");
    form.set("relatedProductSlugs", "");
    form.set("relatedCategorySlugs", "");
    await saveLandingContent(definition.slug, form);
    expect(await loadLandingPage(definition.slug)).toBeNull();
  });
});
