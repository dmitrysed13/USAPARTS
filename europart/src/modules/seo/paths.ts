/** Canonical public path helpers. Trailing slash stripped for Next.js routes. */

export function normalizePublicPath(path: string): string {
  const trimmed = path.trim();
  if (!trimmed || trimmed === "/") {
    return "/";
  }
  const withSlash = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return withSlash.replace(/\/+$/, "") || "/";
}

export function pathsEqual(left: string, right: string): boolean {
  return normalizePublicPath(left) === normalizePublicPath(right);
}

/** Paths that must never be indexed or listed in sitemaps. */
export const NEVER_INDEX_PREFIXES = [
  "/admin",
  "/api",
  "/cart",
  "/checkout",
  "/order",
  "/search",
  "/design-system",
  "/_next",
] as const;

export function isNeverIndexPath(path: string): boolean {
  const normalized = normalizePublicPath(path);
  if (normalized === "/vin-search") {
    return true;
  }
  return NEVER_INDEX_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
}

export function catalogPath(categorySlug?: string): string {
  return categorySlug ? `/catalog/${categorySlug}` : "/catalog";
}

export function brandPath(parts: {
  brand: string;
  model?: string;
  generation?: string;
  modification?: string;
  engine?: string;
}): string {
  const segments = [
    "/brands",
    parts.brand,
    parts.model,
    parts.generation,
    parts.modification,
    parts.engine,
  ].filter(Boolean);
  return segments.join("/");
}

export function productPath(slug: string): string {
  return `/product/${slug}`;
}

/** Spec §8 alias; redirects to productPath. */
export function partsPath(slug: string): string {
  return `/parts/${slug}`;
}

export function oemPath(oem: string): string {
  return `/oem/${encodeURIComponent(oem)}`;
}
