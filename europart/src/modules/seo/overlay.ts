import "server-only";

import type { SeoEntityType, SeoRobotsMode } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export type SeoOverlay = {
  title: string | null;
  description: string | null;
  h1: string | null;
  canonicalPath: string | null;
  seoText: string | null;
  robotsMode: SeoRobotsMode;
  ogImageUrl: string | null;
};

export async function readSeoOverlay(
  entityType: SeoEntityType,
  entityId: string,
  fallback?: { title: string; description: string | null; canonicalPath: string },
): Promise<SeoOverlay & { title: string; description: string | null; h1: string; canonicalPath: string }> {
  const row = await withDatabase(() =>
    getPrismaClient().seoMetadata.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
      select: {
        title: true,
        description: true,
        h1: true,
        canonicalPath: true,
        seoText: true,
        robotsMode: true,
        ogImageUrl: true,
      },
    }),
  );

  const title = row?.title?.trim() || fallback?.title || "";
  return {
    title,
    description: row?.description?.trim() || fallback?.description || null,
    h1: row?.h1?.trim() || title || fallback?.title || "",
    canonicalPath: row?.canonicalPath?.trim() || fallback?.canonicalPath || "",
    seoText: row?.seoText?.trim() || null,
    robotsMode: row?.robotsMode ?? "AUTO",
    ogImageUrl: row?.ogImageUrl?.trim() || null,
  };
}

/** @deprecated Prefer buildSeo + readSeoOverlay; kept for gradual migration. */
export async function readSeoOverlayLegacy(
  entityType: SeoEntityType,
  entityId: string,
  fallback: { title: string; description: string | null; canonicalPath: string },
) {
  return readSeoOverlay(entityType, entityId, fallback);
}
