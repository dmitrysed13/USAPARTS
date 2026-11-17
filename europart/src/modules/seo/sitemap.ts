import "server-only";

import type { MetadataRoute } from "next";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";
import { listCmsSitemapEntries } from "@/modules/content/public";
import { cmsPublicPath } from "@/modules/content/paths";
import { absoluteUrl } from "@/modules/seo/canonical";
import { brandPath, catalogPath, productPath } from "@/modules/seo/paths";
import { isIndexingEnabled } from "@/modules/seo/policy";

export const SITEMAP_IDS = [
  "pages",
  "categories",
  "brands",
  "products",
  "oem",
  "articles",
] as const;
export type SitemapId = (typeof SITEMAP_IDS)[number];

function entry(path: string, lastModified?: Date | null): MetadataRoute.Sitemap[number] {
  return {
    url: absoluteUrl(path),
    lastModified: lastModified ?? undefined,
    changeFrequency: "weekly",
    priority: path === "/" ? 1 : 0.7,
  };
}

/** Quality gate: published product with an active offer that has a retail price. */
function publishedWithPriceWhere() {
  return {
    status: "PUBLISHED" as const,
    offers: {
      some: {
        status: "ACTIVE" as const,
        retailPrice: { not: null },
      },
    },
  };
}

export async function buildSitemapSlice(id: SitemapId): Promise<MetadataRoute.Sitemap> {
  if (!(await isIndexingEnabled())) {
    return [];
  }

  if (id === "pages") {
    const base = [entry("/"), entry("/catalog"), entry("/brands")];
    // Index hubs only when they have published quality content.
    const [cmsRows, faqs, reviews] = await Promise.all([
      listCmsSitemapEntries(),
      withDatabase(() =>
        getPrismaClient().cmsDocument.count({
          where: { status: "PUBLISHED", kind: "FAQ" },
        }),
      ),
      withDatabase(() =>
        getPrismaClient().cmsDocument.count({
          where: {
            status: "PUBLISHED",
            kind: "REVIEW",
            reviewConfirmed: true,
          },
        }),
      ),
    ]);
    if (cmsRows.some((row) => row.kind === "ARTICLE")) {
      base.push(entry("/blog"));
    }
    if (cmsRows.some((row) => row.kind === "GUIDE")) {
      base.push(entry("/guides"));
    }
    if (faqs > 0) {
      base.push(entry("/faq"));
    }
    if (reviews > 0) {
      base.push(entry("/reviews"));
    }
    return base;
  }

  if (id === "articles") {
    const rows = await listCmsSitemapEntries();
    return rows
      .map((row) => {
        const path = cmsPublicPath(row.kind, row.slug);
        if (!path || path.includes("#")) {
          return null;
        }
        return entry(path, row.updatedAt ?? row.publishedAt);
      })
      .filter((row): row is MetadataRoute.Sitemap[number] => Boolean(row));
  }

  if (id === "categories") {
    const categories = await withDatabase(() =>
      getPrismaClient().category.findMany({
        where: {
          isActive: true,
          products: { some: publishedWithPriceWhere() },
        },
        select: { slug: true, updatedAt: true },
        orderBy: { sortOrder: "asc" },
      }),
    );
    return categories.map((row) => entry(catalogPath(row.slug), row.updatedAt));
  }

  if (id === "brands") {
    const brands = await withDatabase(() =>
      getPrismaClient().vehicleBrand.findMany({
        where: {
          isActive: true,
          models: {
            some: {
              isActive: true,
              generations: {
                some: {
                  modifications: {
                    some: {
                      compatibilities: {
                        some: { product: publishedWithPriceWhere() },
                      },
                    },
                  },
                },
              },
            },
          },
        },
        select: {
          slug: true,
          updatedAt: true,
          models: {
            where: {
              isActive: true,
              generations: {
                some: {
                  modifications: {
                    some: {
                      compatibilities: {
                        some: { product: publishedWithPriceWhere() },
                      },
                    },
                  },
                },
              },
            },
            select: { slug: true, updatedAt: true },
          },
        },
      }),
    );
    const rows: MetadataRoute.Sitemap = [];
    for (const brand of brands) {
      rows.push(entry(brandPath({ brand: brand.slug }), brand.updatedAt));
      for (const model of brand.models) {
        rows.push(
          entry(brandPath({ brand: brand.slug, model: model.slug }), model.updatedAt),
        );
      }
    }
    return rows;
  }

  if (id === "products") {
    const products = await withDatabase(() =>
      getPrismaClient().product.findMany({
        where: publishedWithPriceWhere(),
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 50_000,
      }),
    );
    return products.map((row) => entry(productPath(row.slug), row.updatedAt));
  }

  // oem: distinct OEM values that have at least one priced published product
  const products = await withDatabase(() =>
    getPrismaClient().product.findMany({
      where: {
        ...publishedWithPriceWhere(),
        oem: { not: null },
      },
      select: { oem: true, updatedAt: true },
      distinct: ["oem"],
      take: 20_000,
    }),
  );
  return products
    .filter((row): row is { oem: string; updatedAt: Date } => Boolean(row.oem))
    .map((row) => entry(`/oem/${encodeURIComponent(row.oem)}`, row.updatedAt));
}
