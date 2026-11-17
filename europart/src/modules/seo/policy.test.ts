import { describe, expect, it } from "vitest";
import { decideIndex, envIndexingFlag } from "@/modules/seo/policy";

describe("SEO indexing policy", () => {
  it("reads env indexing flag", () => {
    expect(envIndexingFlag({ SEO_INDEXING_ENABLED: "true" })).toBe(true);
    expect(envIndexingFlag({ SEO_INDEXING_ENABLED: "false" })).toBe(false);
    expect(envIndexingFlag({})).toBe(false);
  });

  it("never indexes search/cart/admin", () => {
    expect(
      decideIndex({
        indexingEnabled: true,
        path: "/search",
        hasQualityContent: true,
      }).index,
    ).toBe(false);
    expect(
      decideIndex({
        indexingEnabled: true,
        path: "/cart",
        hasQualityContent: true,
      }).index,
    ).toBe(false);
  });

  it("indexes only quality content when open", () => {
    expect(
      decideIndex({
        indexingEnabled: true,
        path: "/product/foo",
        hasQualityContent: true,
      }).index,
    ).toBe(true);
    expect(
      decideIndex({
        indexingEnabled: true,
        path: "/product/foo",
        hasQualityContent: false,
      }).index,
    ).toBe(false);
    expect(
      decideIndex({
        indexingEnabled: false,
        path: "/product/foo",
        hasQualityContent: true,
      }).index,
    ).toBe(false);
  });
});
