import { describe, expect, it } from "vitest";
import nextConfig from "../../../next.config";
import {
  fullTitle,
  getLanding,
  landingDefinitions,
  parseFaqText,
  resolveLanding,
  visibleLinks,
  type LandingSlug,
} from "@/modules/seo/landings";
import { productStructuredData } from "@/modules/seo/structured-data";
import type { PublicProduct } from "@/modules/catalog/public-dto";

function resolved(productCount = 0) {
  return landingDefinitions.map((definition) =>
    resolveLanding(definition, null, productCount),
  );
}

describe("seo landings", () => {
  it("keeps titles, descriptions and headings unique and within the limits", () => {
    const pages = resolved();
    const titles = pages.map((page) => fullTitle(page.title));
    const descriptions = pages.map((page) => page.description);
    const headings = pages.map((page) => page.h1);
    expect(new Set(titles).size).toBe(titles.length);
    expect(new Set(descriptions).size).toBe(descriptions.length);
    expect(new Set(headings).size).toBe(headings.length);
    for (const title of titles) {
      expect(title.length).toBeLessThanOrEqual(60);
    }
    for (const description of descriptions) {
      expect(description.length).toBeLessThanOrEqual(160);
    }
    for (const page of pages) {
      expect(page.canonicalPath).toBe(page.path);
      expect(page.faq.length).toBeGreaterThan(0);
    }
    const questions = pages.flatMap((page) => page.faq.map((item) => item.question));
    expect(new Set(questions).size).toBe(questions.length);
  });

  it("indexes the distinct commercial pages and holds back the rest", () => {
    const open = resolved(0)
      .filter((page) => page.indexable)
      .map((page) => page.path)
      .sort();
    expect(open).toEqual(
      [
        "/avtozapchasti",
        "/avtozapchasti-belarus",
        "/katalog-zapchastey",
        "/kupit-zapchasti",
        "/magazin-avtozapchastey",
      ].sort(),
    );
    const withProducts = resolved(2)
      .filter((page) => page.indexable)
      .map((page) => page.slug);
    expect(withProducts).toContain("zapchasti-audi");
    expect(withProducts).toContain("zapchasti-mtz");
    expect(withProducts).toContain("bu-zapchasti");
    expect(withProducts).not.toContain("avtozapchasti-minsk");
    expect(withProducts).not.toContain("avtozapchasti-gomel");
  });

  it("does not let an editor index an empty assortment page", () => {
    const audi = getLanding("zapchasti-audi");
    expect(audi).not.toBeNull();
    const closed = resolveLanding(
      audi!,
      {
        h1: null,
        title: null,
        description: null,
        intro: null,
        body: null,
        faq: null,
        canonicalPath: null,
        indexable: true,
        published: true,
        relatedProductSlugs: [],
        relatedCategorySlugs: [],
      },
      0,
    );
    expect(closed.indexable).toBe(false);
    const minsk = getLanding("avtozapchasti-minsk")!;
    const opened = resolveLanding(
      minsk,
      {
        h1: null,
        title: null,
        description: null,
        intro: null,
        body: null,
        faq: null,
        canonicalPath: null,
        indexable: true,
        published: true,
        relatedProductSlugs: [],
        relatedCategorySlugs: [],
      },
      0,
    );
    expect(opened.indexable).toBe(true);
  });

  it("hides withheld targets from the hub until they can be indexed", () => {
    const hub = resolved(0).find((page) => page.slug === "avtozapchasti");
    expect(hub).toBeTruthy();
    const indexable = new Set<LandingSlug>(
      resolved(0)
        .filter((page) => page.indexable)
        .map((page) => page.slug),
    );
    const hrefs = visibleLinks(hub!, indexable).map((link) => link.href);
    expect(hrefs).not.toContain("/zapchasti-audi");
    expect(hrefs).not.toContain("/bu-zapchasti");
    expect(hrefs).toContain("/kupit-zapchasti");
  });

  it("does not create competitor or duplicate sale pages", async () => {
    const slugs = landingDefinitions.map((page) => page.slug);
    expect(slugs).not.toContain("prodazha-avtozapchastey");
    expect(slugs).not.toContain("kupit-bu-zapchasti");
    const blob = JSON.stringify(landingDefinitions).toLowerCase();
    expect(blob).not.toContain("куфар");
    expect(blob).not.toContain("бампер бай");
    const redirects = await nextConfig.redirects?.();
    expect(redirects).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: "/prodazha-avtozapchastey",
          destination: "/kupit-zapchasti",
          permanent: true,
        }),
        expect.objectContaining({
          source: "/kupit-bu-zapchasti",
          destination: "/bu-zapchasti",
          permanent: true,
        }),
      ]),
    );
  });

  it("reads a faq block", () => {
    expect(
      parseFaqText("Как заказать?\nОставьте VIN.\n\nГде самовывоз?\nВ Бресте."),
    ).toEqual([
      { question: "Как заказать?", answer: "Оставьте VIN." },
      { question: "Где самовывоз?", answer: "В Бресте." },
    ]);
  });

  it("omits an offer when the product has no price", () => {
    const product = {
      id: "1",
      name: "Фильтр",
      slug: "filtr",
      description: null,
      article: "000",
      oem: null,
      condition: "NEW",
      productType: "ORIGINAL",
      weightKg: null,
      category: { name: "Фильтры", slug: "filtry" },
      partBrand: null,
      images: [],
      identifiers: [],
      compatibility: [],
      price: null,
      availability: "unknown",
      leadTimeDays: null,
    } satisfies PublicProduct;
    expect(productStructuredData(product, "https://europart.by")).toBeNull();
  });
});
