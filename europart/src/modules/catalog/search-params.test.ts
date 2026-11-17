import { describe, expect, it } from "vitest";
import { categoryAndDescendantIds } from "@/modules/catalog/filters";
import { literalSearchText, parseSearchQuery } from "@/modules/catalog/search-params";

describe("catalog query guards", () => {
  it("rejects a one-character search", () => {
    expect(parseSearchQuery({ q: "a" }).ok).toBe(false);
  });

  it("strips LIKE wildcards from the literal text", () => {
    expect(literalSearchText("OC%_\\90")).toBe("OC90");
  });

  it("walks nested categories without looping", () => {
    const ids = categoryAndDescendantIds(
      [
        { id: "root", parentId: null },
        { id: "child", parentId: "root" },
        { id: "loop", parentId: "loop" },
      ],
      "root",
    );
    expect(ids).toEqual(["root", "child"]);
  });
});
