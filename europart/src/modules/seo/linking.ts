import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";
import { brandPath, catalogPath, productPath } from "@/modules/seo/paths";

export type InternalLink = {
  href: string;
  label: string;
  kind: "category" | "brand" | "model" | "product" | "oem" | "analog";
};

/**
 * Internal links only to pages with real published assortment.
 * Search analog links are noindex utility URLs — OK as UX, excluded from sitemap.
 */
export async function linksForProduct(product: {
  id: string;
  slug: string;
  category: { name: string; slug: string };
  partBrand: { name: string; slug: string } | null;
  analogs: string[];
  oem: string | null;
  compatibility: Array<{
    brandName: string;
    brandSlug: string;
    modelName: string;
    modelSlug: string;
  }>;
}): Promise<InternalLink[]> {
  const links: InternalLink[] = [
    {
      href: catalogPath(product.category.slug),
      label: product.category.name,
      kind: "category",
    },
  ];

  const seen = new Set<string>([links[0]!.href, productPath(product.slug)]);

  for (const row of product.compatibility.slice(0, 8)) {
    const href = brandPath({ brand: row.brandSlug, model: row.modelSlug });
    if (seen.has(href)) {
      continue;
    }
    seen.add(href);
    links.push({
      href,
      label: `${row.brandName} ${row.modelName}`,
      kind: "model",
    });
  }

  if (product.oem) {
    const href = `/oem/${encodeURIComponent(product.oem)}`;
    if (!seen.has(href)) {
      seen.add(href);
      links.push({ href, label: `OEM ${product.oem}`, kind: "oem" });
    }
  }

  for (const analog of product.analogs.slice(0, 5)) {
    links.push({
      href: `/search?q=${encodeURIComponent(analog)}`,
      label: analog,
      kind: "analog",
    });
  }

  const similar = await withDatabase(() =>
    getPrismaClient().product.findMany({
      where: {
        status: "PUBLISHED",
        category: { slug: product.category.slug },
        id: { not: product.id },
      },
      orderBy: { updatedAt: "desc" },
      take: 6,
      select: { slug: true, name: true },
    }),
  );
  for (const row of similar) {
    const href = productPath(row.slug);
    if (seen.has(href)) {
      continue;
    }
    seen.add(href);
    links.push({ href, label: row.name, kind: "product" });
  }

  return links;
}

export async function linksForCategory(categorySlug: string): Promise<InternalLink[]> {
  const rows = await withDatabase(() =>
    getPrismaClient().product.findMany({
      where: {
        status: "PUBLISHED",
        category: { slug: categorySlug },
        compatibilities: { some: { confidence: "VERIFIED" } },
      },
      take: 40,
      select: {
        compatibilities: {
          where: { confidence: "VERIFIED" },
          take: 1,
          select: {
            vehicleModification: {
              select: {
                generation: {
                  select: {
                    model: {
                      select: {
                        slug: true,
                        name: true,
                        brand: { select: { slug: true, name: true } },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    }),
  );

  const links: InternalLink[] = [];
  const seen = new Set<string>();
  for (const product of rows) {
    const model = product.compatibilities[0]?.vehicleModification.generation.model;
    if (!model) {
      continue;
    }
    const href = brandPath({ brand: model.brand.slug, model: model.slug });
    if (seen.has(href)) {
      continue;
    }
    seen.add(href);
    links.push({
      href,
      label: `${model.brand.name} ${model.name}`,
      kind: "model",
    });
    if (links.length >= 12) {
      break;
    }
  }
  return links;
}
