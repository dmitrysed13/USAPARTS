import type { ContentKind } from "@/generated/prisma/client";
import { normalizePublicPath } from "@/modules/seo/paths";

/** Public path for indexable CMS kinds. Section overlays have no standalone URL. */
export function cmsPublicPath(
  kind: ContentKind,
  slug: string,
): string | null {
  const safe = slug.trim();
  if (!safe) {
    return null;
  }
  switch (kind) {
    case "ARTICLE":
      return normalizePublicPath(`/blog/${safe}`);
    case "GUIDE":
      return normalizePublicPath(`/guides/${safe}`);
    case "FAQ":
      return normalizePublicPath(`/faq#${safe}`);
    case "REVIEW":
      return normalizePublicPath(`/reviews#${safe}`);
    case "CATEGORY_CONTENT":
    case "VEHICLE_CONTENT":
      return null;
    default:
      return null;
  }
}

export function cmsIndexPath(kind: ContentKind): string | null {
  switch (kind) {
    case "ARTICLE":
      return "/blog";
    case "GUIDE":
      return "/guides";
    case "FAQ":
      return "/faq";
    case "REVIEW":
      return "/reviews";
    default:
      return null;
  }
}

export function hasStandalonePublicPage(kind: ContentKind): boolean {
  return kind === "ARTICLE" || kind === "GUIDE";
}
