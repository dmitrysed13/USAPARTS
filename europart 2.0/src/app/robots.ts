import type { MetadataRoute } from "next";

/**
 * The storefront has no indexable catalog yet.
 * Stage 7 replaces this with the public crawl policy from SEO_SPECIFICATION.md.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      disallow: "/",
    },
  };
}
