import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";
import { isNeverIndexPath } from "@/modules/seo/paths";

/**
 * Public indexing requires BOTH:
 * - env SEO_INDEXING_ENABLED=true (ops gate; default closed)
 * - SeoSettings.indexingEnabled=true (admin gate; default false)
 * Empty catalog still yields empty sitemaps — no junk URLs.
 */
export function envIndexingFlag(
  source: Record<string, string | undefined> = process.env,
): boolean {
  const value = source.SEO_INDEXING_ENABLED?.trim().toLowerCase();
  return value === "1" || value === "true" || value === "yes";
}

export async function isIndexingEnabled(): Promise<boolean> {
  if (!envIndexingFlag()) {
    return false;
  }
  try {
    const settings = await withDatabase(async () => {
      const prisma = getPrismaClient();
      const existing = await prisma.seoSettings.findFirst({
        orderBy: { createdAt: "asc" },
      });
      if (existing) {
        return existing;
      }
      return prisma.seoSettings.create({
        data: { indexingEnabled: false },
      });
    });
    return settings.indexingEnabled;
  } catch {
    return false;
  }
}

export type IndexDecision = {
  index: boolean;
  follow: boolean;
  reason: string;
};

export function decideIndex(input: {
  indexingEnabled: boolean;
  path: string;
  /** Page has real assortment / unique value. */
  hasQualityContent: boolean;
  robotsMode?: "AUTO" | "INDEX" | "NOINDEX";
}): IndexDecision {
  if (isNeverIndexPath(input.path)) {
    return { index: false, follow: false, reason: "tech-or-utility-path" };
  }
  if (input.robotsMode === "NOINDEX") {
    return { index: false, follow: true, reason: "manual-noindex" };
  }
  if (!input.indexingEnabled) {
    return { index: false, follow: false, reason: "indexing-closed" };
  }
  if (input.robotsMode === "INDEX") {
    return {
      index: input.hasQualityContent,
      follow: true,
      reason: input.hasQualityContent ? "manual-index" : "manual-index-empty",
    };
  }
  if (!input.hasQualityContent) {
    return { index: false, follow: true, reason: "no-quality-content" };
  }
  return { index: true, follow: true, reason: "quality-allowlist" };
}
