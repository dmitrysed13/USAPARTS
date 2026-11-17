import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";
import { isIndexingEnabled } from "@/modules/seo/policy";
import { SITEMAP_IDS } from "@/modules/seo/sitemap";

export default async function robots(): Promise<MetadataRoute.Robots> {
  const open = await isIndexingEnabled();
  const site = getSiteUrl();

  if (!open) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/cart",
          "/checkout",
          "/order",
          "/search",
          "/design-system",
          "/vin-search",
        ],
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/cart",
          "/checkout",
          "/order",
          "/search",
          "/design-system",
          "/vin-search",
        ],
      },
      {
        userAgent: "Yandex",
        allow: "/",
        disallow: [
          "/admin",
          "/api",
          "/cart",
          "/checkout",
          "/order",
          "/search",
          "/design-system",
          "/vin-search",
        ],
      },
    ],
    sitemap: SITEMAP_IDS.map((id) => `${site}/sitemap/${id}.xml`),
  };
}
