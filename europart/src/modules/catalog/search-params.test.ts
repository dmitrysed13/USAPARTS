import { describe, expect, it } from "vitest";
import {
  catalogHref,
  categoryAndDescendantIds,
  parseCatalogFilters,
} from "@/modules/catalog/filters";
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

  it("parses vehicle filter query params", () => {
    const filters = parseCatalogFilters({
      category: "brakes",
      yearFrom: "2015",
      yearTo: "2019",
      fuelType: "дизель",
      sort: "newest",
    });
    expect(filters.category).toBe("brakes");
    expect(filters.yearFrom).toBe(2015);
    expect(filters.yearTo).toBe(2019);
    expect(filters.fuelType).toBe("дизель");
    expect(catalogHref("/brands/vw/golf", filters, 2)).toContain("yearFrom=2015");
  });
});
