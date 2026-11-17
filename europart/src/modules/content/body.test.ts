import { describe, expect, it } from "vitest";
import { hasUsefulBody, splitContentParagraphs } from "@/modules/content/body";
import { cmsPublicPath, hasStandalonePublicPage } from "@/modules/content/paths";

describe("CMS body helpers", () => {
  it("splits paragraphs and rejects empty spam bodies", () => {
    expect(splitContentParagraphs("A\n\nB\n\n\nC")).toEqual(["A", "B", "C"]);
    expect(hasUsefulBody("коротко")).toBe(false);
    expect(hasUsefulBody("Достаточно длинный полезный технический ответ.")).toBe(
      true,
    );
  });

  it("maps public paths only for editorial kinds", () => {
    expect(cmsPublicPath("ARTICLE", "zamena-kolodok")).toBe(
      "/blog/zamena-kolodok",
    );
    expect(cmsPublicPath("GUIDE", "maslo-smena")).toBe("/guides/maslo-smena");
    expect(cmsPublicPath("FAQ", "dostavka")).toBe("/faq#dostavka");
    expect(cmsPublicPath("CATEGORY_CONTENT", "x")).toBeNull();
    expect(hasStandalonePublicPage("ARTICLE")).toBe(true);
    expect(hasStandalonePublicPage("FAQ")).toBe(false);
  });
});
