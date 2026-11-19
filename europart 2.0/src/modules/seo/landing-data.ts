import "server-only";

import { z } from "zod";
import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { DataUnavailableError, withDatabase } from "@/lib/db/errors";
import { getPrismaClient } from "@/lib/db/prisma";
import {
  listCategoriesWithProducts,
  listPublishedProducts,
  type PublicCategory,
} from "@/modules/catalog/repository";
import type { PublicProduct } from "@/modules/catalog/public-dto";
import { parseCatalogFilters } from "@/modules/catalog/filters";
import {
  getLanding,
  isLandingSlug,
  landingDefinitions,
  resolveLanding,
  visibleLinks,
  type Assortment,
  type LandingLink,
  type LandingOverride,
  type LandingSlug,
  type ResolvedLanding,
} from "@/modules/seo/landings";

const faqSchema = z
  .array(
    z.object({
      question: z.string().trim().min(1).max(180),
      answer: z.string().trim().min(1).max(800),
    }),
  )
  .max(8);

function db(): PrismaClient {
  return getPrismaClient();
}

function assortmentWhere(assortment: Assortment): Prisma.ProductWhereInput {
  if (assortment.kind === "condition") {
    return { condition: assortment.condition };
  }
  if (assortment.kind === "vehicle") {
    return {
      OR: [
        {
          compatibilities: {
            some: {
              vehicleModification: {
                model: {
                  brand: { slug: { in: assortment.brandSlugs }, isActive: true },
                },
              },
            },
          },
        },
        { category: { slug: { in: assortment.categorySlugs }, isActive: true } },
      ],
    };
  }
  return {};
}

async function readOverrides(): Promise<Map<LandingSlug, LandingOverride>> {
  const rows = await withDatabase(() =>
    db().seoLandingContent.findMany({
      where: { slug: { in: landingDefinitions.map((item) => item.slug) } },
    }),
  );
  const overrides = new Map<LandingSlug, LandingOverride>();
  for (const row of rows) {
    if (!isLandingSlug(row.slug)) {
      continue;
    }
    const faq = faqSchema.safeParse(row.faq);
    overrides.set(row.slug, {
      h1: row.h1,
      title: row.title,
      description: row.description,
      intro: row.intro,
      body: row.body,
      faq: faq.success ? faq.data : null,
      canonicalPath: row.canonicalPath,
      indexable: row.indexable,
      published: row.published,
      relatedProductSlugs: row.relatedProductSlugs,
      relatedCategorySlugs: row.relatedCategorySlugs,
    });
  }
  return overrides;
}

async function countAssortment(assortment: Assortment): Promise<number> {
  const page = await listPublishedProducts(
    parseCatalogFilters({ sort: "newest" }, 1),
    assortmentWhere(assortment),
  );
  return page.total;
}

export async function loadResolvedLandings(): Promise<ResolvedLanding[]> {
  const overrides = await readOverrides();
  const counts = new Map<LandingSlug, number>();
  await Promise.all(
    landingDefinitions.map(async (definition) => {
      counts.set(definition.slug, await countAssortment(definition.assortment));
    }),
  );
  return landingDefinitions.map((definition) =>
    resolveLanding(
      definition,
      overrides.get(definition.slug) ?? null,
      counts.get(definition.slug) ?? 0,
    ),
  );
}

export async function listIndexableLandingPaths(): Promise<string[]> {
  try {
    const landings = await loadResolvedLandings();
    return landings
      .filter((landing) => landing.published && landing.indexable)
      .map((landing) => landing.path);
  } catch (error) {
    if (!(error instanceof DataUnavailableError)) {
      throw error;
    }
    return landingDefinitions
      .map((definition) => resolveLanding(definition, null, 0))
      .filter((landing) => landing.indexable)
      .map((landing) => landing.path);
  }
}

async function productsFor(landing: ResolvedLanding): Promise<PublicProduct[]> {
  const selected =
    landing.relatedProductSlugs.length > 0
      ? (
          await listPublishedProducts(parseCatalogFilters({}, 12), {
            slug: { in: landing.relatedProductSlugs.slice(0, 12) },
          })
        ).items
      : [];
  const automatic = await listPublishedProducts(
    parseCatalogFilters({ sort: "newest" }, 6),
    assortmentWhere(landing.assortment),
  );
  const seen = new Set(selected.map((product) => product.slug));
  return [
    ...selected,
    ...automatic.items.filter((product) => !seen.has(product.slug)),
  ].slice(0, 6);
}

export type LandingPageData = {
  landing: ResolvedLanding;
  products: PublicProduct[];
  categories: PublicCategory[];
  links: LandingLink[];
};

export async function loadLandingPage(slug: string): Promise<LandingPageData | null> {
  const definition = getLanding(slug);
  if (!definition) {
    return null;
  }
  const landings = await loadResolvedLandings();
  const landing = landings.find((item) => item.slug === definition.slug);
  if (!landing || !landing.published) {
    return null;
  }
  const indexable = new Set(
    landings.filter((item) => item.indexable).map((item) => item.slug),
  );
  const categories = await listCategoriesWithProducts();
  const visibleCategories =
    landing.relatedCategorySlugs.length > 0
      ? categories.filter((category) =>
          landing.relatedCategorySlugs.includes(category.slug),
        )
      : categories;
  return {
    landing,
    products: await productsFor(landing),
    categories: visibleCategories,
    links: visibleLinks(landing, indexable),
  };
}
