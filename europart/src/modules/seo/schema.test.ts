import { describe, expect, it } from "vitest";
import {
  articleJsonLd,
  faqPageJsonLd,
  productJsonLd,
  jsonLdScript,
} from "@/modules/seo/schema";

describe("schema.org product", () => {
  it("omits Offer without price and never adds AggregateRating", () => {
    const bare = productJsonLd({
      name: "Колодка",
      path: "/product/kolodka",
      availability: "in_stock",
    });
    expect(bare.offers).toBeUndefined();
    expect(JSON.stringify(bare)).not.toContain("AggregateRating");

    const priced = productJsonLd({
      name: "Колодка",
      path: "/product/kolodka",
      price: { amount: "10.00", currency: "BYN" },
      availability: "unknown",
    });
    expect(priced.offers).toMatchObject({
      "@type": "Offer",
      price: "10.00",
      priceCurrency: "BYN",
      availability: "https://schema.org/OutOfStock",
    });
    expect(jsonLdScript(priced)).not.toContain("AggregateRating");
  });
});

describe("schema.org CMS", () => {
  it("builds Article with author and never invents AggregateRating", () => {
    const data = articleJsonLd({
      headline: "Замена колодок",
      path: "/blog/zamena-kolodok",
      datePublished: "2026-11-17T00:00:00.000Z",
      authorName: "Редактор EUROPART",
    });
    expect(data["@type"]).toBe("Article");
    expect(data.author).toEqual({
      "@type": "Person",
      name: "Редактор EUROPART",
    });
    expect(JSON.stringify(data)).not.toContain("AggregateRating");
  });

  it("emits FAQPage only for real Q&A pairs", () => {
    expect(faqPageJsonLd([])).toBeNull();
    expect(
      faqPageJsonLd([{ question: "Как?", answer: "коротко" }]),
    ).toBeNull();
    const page = faqPageJsonLd([
      {
        question: "Как подобрать по OEM?",
        answer:
          "Введите OEM в поиске. Показываем только опубликованные позиции с реальным предложением.",
      },
    ]);
    expect(page?.["@type"]).toBe("FAQPage");
  });
});
