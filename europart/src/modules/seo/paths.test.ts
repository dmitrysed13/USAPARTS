import { describe, expect, it } from "vitest";
import {
  isNeverIndexPath,
  normalizePublicPath,
  partsPath,
  productPath,
} from "@/modules/seo/paths";

describe("SEO paths", () => {
  it("normalizes trailing slashes", () => {
    expect(normalizePublicPath("/catalog/")).toBe("/catalog");
    expect(normalizePublicPath("/")).toBe("/");
  });

  it("maps parts alias to product canonical", () => {
    expect(partsPath("abc")).toBe("/parts/abc");
    expect(productPath("abc")).toBe("/product/abc");
  });

  it("flags utility paths", () => {
    expect(isNeverIndexPath("/admin/seo")).toBe(true);
    expect(isNeverIndexPath("/vin-search")).toBe(true);
    expect(isNeverIndexPath("/product/x")).toBe(false);
  });
});
