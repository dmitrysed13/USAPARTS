import assert from "node:assert/strict";
import { test } from "node:test";
import { keywords } from "./keywords.ts";
import { pages } from "./pages.ts";

test("indexable pages have unique paths, titles, descriptions and h1", () => {
  const paths = pages.map((page) => page.path);
  const titles = pages.map((page) => page.title);
  const descriptions = pages.map((page) => page.description);
  const headings = pages.map((page) => page.h1);
  for (const list of [paths, titles, descriptions, headings]) {
    assert.equal(new Set(list).size, list.length);
  }
  assert.ok(pages.some((page) => page.path === "/" && page.kind === "home"));
  for (const page of pages) {
    assert.match(page.path, /^\/(?:[a-z0-9/-]+\/)?$/);
    assert.ok(page.title.length <= 70, page.title);
    assert.ok(page.description.length <= 170, page.description);
    assert.ok(!page.title.includes("  "));
  }
});

test("related links point at real pages", () => {
  const paths = new Set(pages.map((page) => page.path));
  for (const page of pages) {
    for (const link of [...page.related, ...page.crumbs]) {
      assert.ok(paths.has(link.path), `${page.path} -> ${link.path}`);
    }
  }
});

test("keywords do not invent frequency and point at a known plan", () => {
  for (const keyword of keywords) {
    assert.equal(keyword.frequency, null);
    if (keyword.live) assert.ok(pages.some((page) => page.path === keyword.target));
    else assert.match(keyword.target, /^\//);
  }
});
