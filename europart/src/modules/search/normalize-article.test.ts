import { describe, expect, it } from "vitest";
import { normalizeArticle } from "@/modules/search/normalize-article";

describe("article normalization", () => {
  it("removes separators and ignores letter case", () => {
    expect(normalizeArticle("  1K0 615 301 AA ")).toBe("1K0615301AA");
    expect(normalizeArticle("1k0-615-301-aa")).toBe("1K0615301AA");
    expect(normalizeArticle("03L.115.561.B")).toBe("03L115561B");
    expect(normalizeArticle("03L/115/561/B")).toBe("03L115561B");
  });
});
