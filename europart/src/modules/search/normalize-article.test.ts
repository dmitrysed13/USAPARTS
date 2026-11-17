import { describe, expect, it } from "vitest";
import { normalizeArticle } from "@/modules/search/normalize-article";

describe("normalizeArticle", () => {
  it("ignores case, spaces, dashes, dots and slashes", () => {
    expect(normalizeArticle("1k0 615-301.AA")).toBe("1K0615301AA");
    expect(normalizeArticle("gdb/1")).toBe("GDB1");
  });
});
