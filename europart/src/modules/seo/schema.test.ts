import { describe, expect, it } from "vitest";
import { productJsonLd, jsonLdScript } from "@/modules/seo/schema";

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
