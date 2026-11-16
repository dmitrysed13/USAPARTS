import assert from "node:assert/strict";
import { test } from "node:test";
import { assertProductionOrigin, resolveSiteOrigin } from "./origin.ts";
import { auditSitemap, renderRobots, renderSitemap } from "./seoFiles.ts";

test("production origin must be public https", () => {
  assert.equal(assertProductionOrigin("https://parts.example.by/"), "https://parts.example.by");
  for (const value of ["", "http://parts.example.by", "https://localhost", "https://127.0.0.1", "https://example.com", "https://YOUR-DOMAIN", "https://parts.example.by/avtozapchasti/"]) {
    assert.throws(() => assertProductionOrigin(value), Error);
  }
});

test("development can fall back to the local vite origin", () => {
  assert.equal(resolveSiteOrigin("", false), "http://127.0.0.1:5173");
  assert.throws(() => resolveSiteOrigin("", true), /https/);
});

test("sitemap lists only absolute canonical urls", () => {
  const origin = "https://parts.example.by";
  const paths = ["/", "/avtozapchasti/ford/mustang/", "/avtozapchasti/honda/cr-v/"];
  const xml = renderSitemap(paths, origin);
  const robots = renderRobots(origin);
  assert.deepEqual(auditSitemap(xml, origin, paths), []);
  assert.match(robots, /Sitemap: https:\/\/parts\.example\.by\/sitemap\.xml/);
  assert.equal(robots.includes("Disallow: /assets"), false);
  assert.equal(robots.includes("127.0.0.1"), false);
  assert.match(xml, /<loc>https:\/\/parts\.example\.by\/avtozapchasti\/ford\/mustang\/<\/loc>/);
});
