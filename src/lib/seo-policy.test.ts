import assert from "node:assert/strict";
import test from "node:test";
import { canonicalPath, isIndexableListing } from "./seo-policy";

test("indexes a real assortment without filters", () => {
  assert.equal(isIndexableListing({ productCount: 3 }), true);
});

test("does not index empty or filtered listings", () => {
  assert.equal(isIndexableListing({ productCount: 0 }), false);
  assert.equal(isIndexableListing({ productCount: 4, sort: "price_asc" }), false);
  assert.equal(isIndexableListing({ productCount: 4, q: "oem" }), false);
});

test("keeps page in the canonical path", () => {
  assert.equal(canonicalPath("/catalog/engine", 2), "/catalog/engine?page=2");
  assert.equal(canonicalPath("/catalog/engine", 1), "/catalog/engine");
});
