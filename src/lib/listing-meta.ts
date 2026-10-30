import type { Metadata } from "next";
import { canonicalPath, isIndexableListing } from "@/lib/seo-policy";
import type { ListFilters } from "@/lib/catalog";

export function listingMetadata(input: {
  title: string;
  description: string;
  path: string;
  filters: ListFilters;
  total: number;
}): Metadata {
  const index = isIndexableListing({
    productCount: input.total,
    sort: input.filters.sort,
    availability: input.filters.availability,
    condition: input.filters.condition,
    q: input.filters.q,
    engine: input.filters.engine,
  });
  const noisy = Boolean(input.filters.sort || input.filters.availability || input.filters.condition || input.filters.q || input.filters.engine);
  const canonical = noisy ? input.path : canonicalPath(input.path, input.filters.page);
  return {
    title: input.title,
    description: input.description,
    alternates: { canonical },
    robots: index ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: input.title, description: input.description, url: canonical },
  };
}
