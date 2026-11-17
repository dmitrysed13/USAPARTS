import { getSiteUrl } from "@/lib/env";
import { normalizePublicPath } from "@/modules/seo/paths";

export function absoluteUrl(
  path: string,
  source: Record<string, string | undefined> = process.env,
): string {
  const base = getSiteUrl(source);
  const normalized = normalizePublicPath(path);
  return normalized === "/" ? `${base}/` : `${base}${normalized}`;
}

export function canonicalAlternates(path: string) {
  return { canonical: normalizePublicPath(path) };
}
