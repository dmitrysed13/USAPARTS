import { describe, expect, it } from "vitest";
import { applySeoTemplate } from "@/modules/seo/templates";

describe("SEO templates", () => {
  it("builds category and product titles without inventing Minsk", () => {
    const category = applySeoTemplate("category", { category: "Тормозные колодки" });
    expect(category.title).toContain("Тормозные колодки");
    expect(category.title.toLowerCase()).not.toContain("минск");
    expect(category.h1).toBe("Тормозные колодки");

    const product = applySeoTemplate("product", {
      name: "Колодка",
      article: "1K0615301AA",
      partBrand: "ATE",
    });
    expect(product.title).toContain("1K0615301AA");
    expect(product.title).toContain("ATE");
    expect(product.h1).toBe("Колодка");
  });

  it("builds OEM landing copy", () => {
    const oem = applySeoTemplate("oem", { oem: "1K0 615 301 AA" });
    expect(oem.title).toContain("OEM");
    expect(oem.h1).toContain("1K0 615 301 AA");
  });
});
