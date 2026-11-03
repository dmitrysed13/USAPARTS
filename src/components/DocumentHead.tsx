import { useEffect } from "react";
import { absoluteUrl, publicToken } from "../seo/site.ts";
import { pageGraph } from "../seo/schema.ts";
import type { SeoPage } from "../seo/types.ts";

function upsertMeta(attribute: "name" | "property", key: string, content: string) {
  let node = document.head.querySelector(`meta[${attribute}="${key}"]`);
  if (!node) {
    node = document.createElement("meta");
    node.setAttribute(attribute, key);
    document.head.appendChild(node);
  }
  node.setAttribute("content", content);
}

function upsertLink(rel: string, href: string) {
  let node = document.head.querySelector(`link[rel="${rel}"]`);
  if (!node) {
    node = document.createElement("link");
    node.setAttribute("rel", rel);
    document.head.appendChild(node);
  }
  node.setAttribute("href", href);
}

type DocumentHeadProps = {
  page?: SeoPage;
  title: string;
  description: string;
  path: string;
  robots: string;
};

export function DocumentHead({ page, title, description, path, robots }: DocumentHeadProps) {
  useEffect(() => {
    document.documentElement.lang = "ru";
    document.title = title;
    upsertMeta("name", "description", description);
    upsertMeta("name", "robots", robots);
    upsertLink("canonical", absoluteUrl(path));
    upsertMeta("property", "og:title", title);
    upsertMeta("property", "og:description", description);
    upsertMeta("property", "og:type", "website");
    upsertMeta("property", "og:locale", "ru_RU");
    upsertMeta("property", "og:url", absoluteUrl(path));
    const image = absoluteUrl("/favicon.svg");
    if (image.startsWith("https://")) upsertMeta("property", "og:image", image);
    const google = publicToken("VITE_GOOGLE_SITE_VERIFICATION");
    const yandex = publicToken("VITE_YANDEX_VERIFICATION");
    if (google) upsertMeta("name", "google-site-verification", google);
    if (yandex) upsertMeta("name", "yandex-verification", yandex);
  }, [description, path, robots, title]);

  if (!page) return null;
  return (
    <script
      type="application/ld+json"
      data-seo="jsonld"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(pageGraph(page)).replace(/</g, "\\u003c") }}
    />
  );
}
