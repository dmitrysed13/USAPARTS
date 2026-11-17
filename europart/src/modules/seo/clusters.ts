import "server-only";

import type { SemanticClusterIntent } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";
import { SEMANTIC_CLUSTER_INTENTS } from "@/modules/seo/cluster-intents";
import { normalizePublicPath } from "@/modules/seo/paths";

export { SEMANTIC_CLUSTER_INTENTS };

function slugify(value: string): string {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9а-яё]+/gi, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80);
}

export async function listSemanticClusters() {
  return withDatabase(() =>
    getPrismaClient().semanticCluster.findMany({
      orderBy: { updatedAt: "desc" },
      include: { _count: { select: { keywords: true } } },
      take: 200,
    }),
  );
}

export async function createSemanticCluster(input: {
  name: string;
  intent: SemanticClusterIntent;
  slug?: string;
  targetPath?: string | null;
  notes?: string | null;
  keywords?: string[];
}) {
  const name = input.name.trim().slice(0, 200);
  if (!name) {
    throw new Error("Укажите название кластера.");
  }
  const slug = (input.slug?.trim() || slugify(name)).slice(0, 80);
  if (!slug) {
    throw new Error("Не удалось построить slug.");
  }
  const targetPath = input.targetPath?.trim()
    ? normalizePublicPath(input.targetPath)
    : null;
  const keywords = (input.keywords ?? [])
    .map((phrase) => phrase.trim().slice(0, 200))
    .filter(Boolean);

  return withDatabase(() =>
    getPrismaClient().semanticCluster.create({
      data: {
        name,
        slug,
        intent: input.intent,
        targetPath,
        notes: input.notes?.trim().slice(0, 2000) || null,
        keywords: keywords.length
          ? {
              create: keywords.map((phrase) => ({ phrase, locale: "ru" })),
            }
          : undefined,
      },
      include: { keywords: true },
    }),
  );
}
