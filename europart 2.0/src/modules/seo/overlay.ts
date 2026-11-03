import "server-only";

import type { SeoEntityType } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export type SeoOverlay = {
  title: string;
  description: string | null;
  h1: string;
  canonicalPath: string;
};

export async function readSeoOverlay(
  entityType: SeoEntityType,
  entityId: string,
  fallback: { title: string; description: string | null; canonicalPath: string },
): Promise<SeoOverlay> {
  const row = await withDatabase(() =>
    getPrismaClient().seoMetadata.findUnique({
      where: { entityType_entityId: { entityType, entityId } },
      select: {
        title: true,
        description: true,
        h1: true,
        canonicalPath: true,
      },
    }),
  );

  return {
    title: row?.title?.trim() || fallback.title,
    description: row?.description?.trim() || fallback.description,
    h1: row?.h1?.trim() || fallback.title,
    canonicalPath: row?.canonicalPath?.trim() || fallback.canonicalPath,
  };
}
