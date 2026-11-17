import { describe, expect, it } from "vitest";
import { buildSeo } from "@/modules/seo/generator";

describe("buildSeo", () => {
  it("prefers manual overlay and keeps closed robots when indexing disabled", () => {
    const built = buildSeo({
      kind: "product",
      vars: { name: "Колодка", article: "A1" },
      path: "/product/kolodka",
      indexingEnabled: false,
      hasQualityContent: true,
      overlay: {
        title: "Ручной title",
        description: "Ручное описание",
        h1: "Ручной H1",
        canonicalPath: "/product/kolodka",
        seoText: "Уникальный абзац",
        robotsMode: "AUTO",
        ogImageUrl: null,
      },
    });
    expect(built.title).toBe("Ручной title");
    expect(built.h1).toBe("Ручной H1");
    expect(built.seoText).toBe("Уникальный абзац");
    expect(built.metadata.robots).toEqual({ index: false, follow: false });
    expect(built.metadata.openGraph).toMatchObject({ locale: "ru_BY", siteName: "EUROPART" });
  });
});
