import type { MetadataRoute } from "next";
import { getSiteUrl } from "@/lib/env";

/**
 * Crawl is open only so indexable landings can be found.
 * Admin, API, the design system and search URLs stay out.
 * Empty catalog, drafts and withheld landings send noindex themselves.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/admin", "/api", "/design-system", "/search"],
    },
    sitemap: `${getSiteUrl()}/sitemap.xml`,
  };
}
