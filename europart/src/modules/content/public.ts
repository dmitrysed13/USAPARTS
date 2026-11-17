import "server-only";

import type { ContentKind } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";
import { hasUsefulBody } from "@/modules/content/body";
import { productPath } from "@/modules/seo/paths";
import type { InternalLink } from "@/modules/seo/linking";

const publicInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  relatedProducts: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          article: true,
          offers: {
            where: { status: "ACTIVE" as const, retailPrice: { not: null } },
            take: 1,
            select: { id: true },
          },
        },
      },
    },
  },
} as const;

function storefrontWhere(kind: ContentKind) {
  return {
    kind,
    status: "PUBLISHED" as const,
    ...(kind === "REVIEW" ? { reviewConfirmed: true } : {}),
  };
}

export type PublicCmsDocument = NonNullable<
  Awaited<ReturnType<typeof getPublishedCmsDocument>>
>;

/** Published document for storefront. Reviews require confirmation. */
export async function getPublishedCmsDocument(kind: ContentKind, slug: string) {
  const row = await withDatabase(() =>
    getPrismaClient().cmsDocument.findFirst({
      where: { ...storefrontWhere(kind), slug },
      include: publicInclude,
    }),
  );
  if (!row || !hasUsefulBody(row.body)) {
    return null;
  }
  return row;
}

export async function listPublishedCmsDocuments(kind: ContentKind, take = 100) {
  const rows = await withDatabase(() =>
    getPrismaClient().cmsDocument.findMany({
      where: storefrontWhere(kind),
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      take,
      include: publicInclude,
    }),
  );
  return rows.filter((row) => hasUsefulBody(row.body));
}

/** Editorial block for a category page (latest published CATEGORY_CONTENT). */
export async function getPublishedCategoryContent(categoryId: string) {
  const row = await withDatabase(() =>
    getPrismaClient().cmsDocument.findFirst({
      where: {
        ...storefrontWhere("CATEGORY_CONTENT"),
        categoryId,
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      include: publicInclude,
    }),
  );
  if (!row || !hasUsefulBody(row.body)) {
    return null;
  }
  return row;
}

/** Editorial block for a vehicle brand or model page. */
export async function getPublishedVehicleContent(input: {
  brandId?: string;
  modelId?: string;
}) {
  if (!input.brandId && !input.modelId) {
    return null;
  }
  const row = await withDatabase(() =>
    getPrismaClient().cmsDocument.findFirst({
      where: {
        ...storefrontWhere("VEHICLE_CONTENT"),
        OR: [
          ...(input.modelId ? [{ vehicleModelId: input.modelId }] : []),
          ...(input.brandId ? [{ vehicleBrandId: input.brandId }] : []),
        ],
      },
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      include: publicInclude,
    }),
  );
  if (!row || !hasUsefulBody(row.body)) {
    return null;
  }
  return row;
}

export function relatedProductLinks(
  document: PublicCmsDocument,
): InternalLink[] {
  const links: InternalLink[] = [];
  const seen = new Set<string>();
  for (const link of document.relatedProducts) {
    if (link.product.status !== "PUBLISHED") {
      continue;
    }
    if (link.product.offers.length === 0) {
      continue;
    }
    const href = productPath(link.product.slug);
    if (seen.has(href)) {
      continue;
    }
    seen.add(href);
    links.push({
      href,
      label: link.product.article
        ? `${link.product.name} (${link.product.article})`
        : link.product.name,
      kind: "product",
    });
  }
  return links;
}

/** Sitemap quality rows: published standalone articles/guides with useful body. */
export async function listCmsSitemapEntries() {
  const rows = await withDatabase(() =>
    getPrismaClient().cmsDocument.findMany({
      where: {
        status: "PUBLISHED",
        kind: { in: ["ARTICLE", "GUIDE"] },
      },
      select: {
        kind: true,
        slug: true,
        body: true,
        updatedAt: true,
        publishedAt: true,
      },
      orderBy: { updatedAt: "desc" },
      take: 20_000,
    }),
  );
  return rows.filter((row) => hasUsefulBody(row.body));
}
