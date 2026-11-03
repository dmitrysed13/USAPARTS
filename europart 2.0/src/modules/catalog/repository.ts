import "server-only";

import { Prisma, type PrismaClient } from "@/generated/prisma/client";
import { withDatabase } from "@/lib/db/errors";
import { getPrismaClient } from "@/lib/db/prisma";
import { categoryAndDescendantIds, type CatalogFilters } from "@/modules/catalog/filters";
import { toPublicProduct, type PublicProduct } from "@/modules/catalog/public-dto";
import type { SearchQuery } from "@/modules/catalog/search-params";
import { literalSearchText } from "@/modules/catalog/search-params";
import { normalizeArticle } from "@/modules/search/normalize-article";

export type PublicCategory = {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image: string | null;
  parentId: string | null;
  sortOrder: number;
};

export type PublicCategoryNode = PublicCategory & { children: PublicCategoryNode[] };

export type ProductPage = {
  items: PublicProduct[];
  total: number;
  page: number;
  pageSize: number;
};

const categorySelect = {
  id: true,
  name: true,
  slug: true,
  description: true,
  image: true,
  parentId: true,
  sortOrder: true,
} as const;

const publicOfferSelect = {
  retailPrice: true,
  currency: true,
  availabilityStatus: true,
  leadTime: true,
} as const;

const productInclude = {
  category: { select: { name: true, slug: true, isActive: true } },
  partBrand: { select: { name: true, slug: true, country: true, isActive: true } },
  images: { select: { url: true, alt: true, sortOrder: true } },
  identifiers: { select: { value: true, type: true, isPrimary: true } },
  offers: { select: publicOfferSelect },
} satisfies Prisma.ProductInclude;

const productDetailInclude = {
  ...productInclude,
  compatibilities: {
    where: { confidence: "VERIFIED" },
    select: {
      confidence: true,
      vehicleModification: {
        select: {
          name: true,
          yearFrom: true,
          yearTo: true,
          model: {
            select: {
              name: true,
              slug: true,
              brand: { select: { name: true, slug: true, isActive: true } },
            },
          },
        },
      },
    },
  },
} satisfies Prisma.ProductInclude;

type ListedProduct = Prisma.ProductGetPayload<{ include: typeof productInclude }>;
type DetailedProduct = Prisma.ProductGetPayload<{ include: typeof productDetailInclude }>;

function db(): PrismaClient {
  return getPrismaClient();
}

function publishedWhere(): Prisma.ProductWhereInput {
  return {
    status: "PUBLISHED",
    category: { isActive: true },
  };
}

function mapProduct(
  row: ListedProduct | DetailedProduct,
  withFitment: boolean,
): PublicProduct {
  const compatibility =
    withFitment && "compatibilities" in row
      ? row.compatibilities
          .filter((item) => item.vehicleModification.model.brand.isActive)
          .map((item) => ({
            confidence: item.confidence,
            brandName: item.vehicleModification.model.brand.name,
            brandSlug: item.vehicleModification.model.brand.slug,
            modelName: item.vehicleModification.model.name,
            modelSlug: item.vehicleModification.model.slug,
            modificationName: item.vehicleModification.name,
            yearFrom: item.vehicleModification.yearFrom,
            yearTo: item.vehicleModification.yearTo,
          }))
      : [];

  return toPublicProduct({
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description,
    article: row.article,
    oem: row.oem,
    condition: row.condition,
    productType: row.productType,
    weight: row.weight,
    category: { name: row.category.name, slug: row.category.slug },
    partBrand: row.partBrand?.isActive
      ? {
          name: row.partBrand.name,
          slug: row.partBrand.slug,
          country: row.partBrand.country,
        }
      : null,
    images: row.images,
    identifiers: row.identifiers,
    compatibility,
    offers: row.offers.map((offer) => ({
      retailPrice: offer.retailPrice,
      currency: offer.currency,
      availabilityStatus: offer.availabilityStatus,
      leadTime: offer.leadTime,
    })),
  });
}

export function nestCategories(rows: PublicCategory[]): PublicCategoryNode[] {
  const nodes = new Map<string, PublicCategoryNode>(
    rows.map((row) => [row.id, { ...row, children: [] }]),
  );
  const roots: PublicCategoryNode[] = [];
  for (const node of nodes.values()) {
    if (node.parentId) {
      const parent = nodes.get(node.parentId);
      if (parent) {
        parent.children.push(node);
        continue;
      }
    }
    if (!node.parentId) {
      roots.push(node);
    }
  }
  return roots;
}

export async function listActiveCategories(): Promise<PublicCategory[]> {
  return withDatabase(() =>
    db().category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: categorySelect,
    }),
  );
}

export async function listCategoryTree(): Promise<PublicCategoryNode[]> {
  return nestCategories(await listActiveCategories());
}

export async function listCategoriesWithProducts(): Promise<PublicCategory[]> {
  const rows = await withDatabase(() =>
    db().product.findMany({
      where: publishedWhere(),
      distinct: ["categoryId"],
      select: { category: { select: categorySelect } },
    }),
  );
  return rows
    .map((row) => row.category)
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "ru"),
    );
}

export type CategoryPageContext = {
  category: PublicCategory;
  children: PublicCategory[];
  breadcrumb: { name: string; slug: string }[];
  categoryIds: string[];
};

export async function getCategoryPageContext(
  slug: string,
): Promise<CategoryPageContext | null> {
  const rows = await listActiveCategories();
  const category = rows.find((row) => row.slug === slug);
  if (!category) {
    return null;
  }
  const byId = new Map(rows.map((row) => [row.id, row]));
  const breadcrumb: { name: string; slug: string }[] = [];
  const seen = new Set<string>();
  let current: PublicCategory | undefined = category;
  while (current && !seen.has(current.id)) {
    seen.add(current.id);
    breadcrumb.push({ name: current.name, slug: current.slug });
    current = current.parentId ? byId.get(current.parentId) : undefined;
  }
  breadcrumb.reverse();
  const children = rows
    .filter((row) => row.parentId === category.id)
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "ru"),
    );
  return {
    category,
    children,
    breadcrumb,
    categoryIds: categoryAndDescendantIds(rows, category.id),
  };
}

function offerConstraint(filters: CatalogFilters): Prisma.ProductWhereInput {
  if (
    filters.priceMin !== undefined &&
    filters.priceMax !== undefined &&
    filters.priceMin > filters.priceMax
  ) {
    return { id: { in: [] } };
  }

  const retailPrice =
    filters.priceMin !== undefined || filters.priceMax !== undefined
      ? {
          retailPrice: {
            ...(filters.priceMin !== undefined ? { gte: filters.priceMin } : {}),
            ...(filters.priceMax !== undefined ? { lte: filters.priceMax } : {}),
          },
        }
      : {};
  const hasPrice = Object.keys(retailPrice).length > 0;

  if (filters.availability === "UNKNOWN") {
    return {
      AND: [
        {
          OR: [
            { offers: { none: {} } },
            { offers: { every: { availabilityStatus: "UNKNOWN" } } },
          ],
        },
        ...(hasPrice
          ? [
              {
                offers: {
                  some: { availabilityStatus: "UNKNOWN" as const, ...retailPrice },
                },
              },
            ]
          : []),
      ],
    };
  }

  if (filters.availability || hasPrice) {
    return {
      offers: {
        some: {
          ...(filters.availability ? { availabilityStatus: filters.availability } : {}),
          ...retailPrice,
        },
      },
    };
  }

  return {};
}

function orderBy(filters: CatalogFilters): Prisma.ProductOrderByWithRelationInput[] {
  if (filters.sort === "name_desc") {
    return [{ name: "desc" }, { id: "asc" }];
  }
  if (filters.sort === "newest") {
    return [{ createdAt: "desc" }, { id: "asc" }];
  }
  return [{ name: "asc" }, { id: "asc" }];
}

export async function listPublishedProducts(
  filters: CatalogFilters,
  scope: Prisma.ProductWhereInput,
): Promise<ProductPage> {
  const where: Prisma.ProductWhereInput = {
    AND: [
      publishedWhere(),
      scope,
      offerConstraint(filters),
      filters.condition ? { condition: filters.condition } : {},
      filters.productType ? { productType: filters.productType } : {},
      filters.partBrand ? { partBrand: { slug: filters.partBrand, isActive: true } } : {},
    ],
  };

  const [total, rows] = await withDatabase(() =>
    Promise.all([
      db().product.count({ where }),
      db().product.findMany({
        where,
        include: productInclude,
        orderBy: orderBy(filters),
        skip: (filters.page - 1) * filters.pageSize,
        take: filters.pageSize,
      }),
    ]),
  );

  return {
    items: rows.map((row) => mapProduct(row, false)),
    total,
    page: filters.page,
    pageSize: filters.pageSize,
  };
}

export async function listPartBrandsForProducts(
  scope: Prisma.ProductWhereInput,
): Promise<{ name: string; slug: string }[]> {
  const rows = await withDatabase(() =>
    db().product.findMany({
      where: {
        AND: [publishedWhere(), scope, { partBrand: { isActive: true } }],
      },
      distinct: ["partBrandId"],
      select: { partBrand: { select: { name: true, slug: true } } },
    }),
  );
  return rows
    .flatMap((row) => (row.partBrand ? [row.partBrand] : []))
    .sort((left, right) => left.name.localeCompare(right.name, "ru"));
}

export async function getPublishedProduct(slug: string): Promise<PublicProduct | null> {
  const row = await withDatabase(() =>
    db().product.findFirst({
      where: { slug, ...publishedWhere() },
      include: productDetailInclude,
    }),
  );
  return row ? mapProduct(row, true) : null;
}

export async function listCategoriesForFitment(scope: {
  brandId?: string;
  modelId?: string;
}): Promise<{ name: string; slug: string; description: string | null }[]> {
  const rows = await withDatabase(() =>
    db().product.findMany({
      where: {
        ...publishedWhere(),
        compatibilities: {
          some: {
            confidence: "VERIFIED",
            vehicleModification: {
              ...(scope.modelId ? { modelId: scope.modelId } : {}),
              model: {
                isActive: true,
                ...(scope.brandId ? { brandId: scope.brandId } : {}),
                brand: { isActive: true },
              },
            },
          },
        },
      },
      distinct: ["categoryId"],
      select: {
        category: {
          select: { name: true, slug: true, description: true, sortOrder: true },
        },
      },
    }),
  );
  return rows
    .map((row) => row.category)
    .sort(
      (left, right) =>
        left.sortOrder - right.sortOrder || left.name.localeCompare(right.name, "ru"),
    )
    .map(({ name, slug, description }) => ({ name, slug, description }));
}

function scoreExpression(
  normalized: string,
  prefix: string,
  contains: string,
  literal: string,
): Prisma.Sql {
  return Prisma.sql`
    CASE
      WHEN ${normalized.length > 0} AND pi."normalizedValue" = ${normalized} THEN 100
      WHEN ${normalized.length > 0} AND p."articleNormalized" = ${normalized} THEN 100
      WHEN ${normalized.length > 0} AND pi."normalizedValue" LIKE ${prefix} THEN 70
      WHEN ${normalized.length > 0} AND p."articleNormalized" LIKE ${prefix} THEN 70
      WHEN ${literal.length >= 2} AND p.name ILIKE ${contains} THEN 40
      WHEN ${literal.length >= 2} AND pb.name ILIKE ${contains} THEN 40
      ELSE 0
    END
  `;
}

export async function searchPublishedProducts(query: SearchQuery): Promise<ProductPage> {
  const normalized = normalizeArticle(query.q);
  const literal = literalSearchText(query.q).trim();
  if (!normalized && literal.length < 2) {
    return { items: [], total: 0, page: query.page, pageSize: query.pageSize };
  }

  const prefix = `${normalized}%`;
  const contains = `%${literal}%`;
  const offset = (query.page - 1) * query.pageSize;
  const score = () => scoreExpression(normalized, prefix, contains, literal);

  const [idRows, countRows] = await withDatabase(() =>
    Promise.all([
      db().$queryRaw<Array<{ id: string; score: number }>>(Prisma.sql`
        SELECT ranked.id, ranked.score
        FROM (
          SELECT p.id, p.name, MAX(${score()})::int AS score
          FROM "Product" p
          INNER JOIN "Category" c ON c.id = p."categoryId" AND c."isActive" = true
          LEFT JOIN "ProductIdentifier" pi ON pi."productId" = p.id
          LEFT JOIN "PartBrand" pb ON pb.id = p."partBrandId" AND pb."isActive" = true
          WHERE p.status = 'PUBLISHED'::"ProductStatus"
          GROUP BY p.id, p.name
        ) ranked
        WHERE ranked.score > 0
        ORDER BY ranked.score DESC, ranked.name ASC
        LIMIT ${query.pageSize} OFFSET ${offset}
      `),
      db().$queryRaw<Array<{ total: number }>>(Prisma.sql`
        SELECT COUNT(*)::int AS total
        FROM (
          SELECT p.id
          FROM "Product" p
          INNER JOIN "Category" c ON c.id = p."categoryId" AND c."isActive" = true
          LEFT JOIN "ProductIdentifier" pi ON pi."productId" = p.id
          LEFT JOIN "PartBrand" pb ON pb.id = p."partBrandId" AND pb."isActive" = true
          WHERE p.status = 'PUBLISHED'::"ProductStatus"
          GROUP BY p.id
          HAVING MAX(${score()}) > 0
        ) matched
      `),
    ]),
  );

  const ids = idRows.map((row) => row.id);
  const total = Number(countRows[0]?.total ?? 0);
  if (ids.length === 0) {
    return { items: [], total, page: query.page, pageSize: query.pageSize };
  }

  const rows = await withDatabase(() =>
    db().product.findMany({
      where: { id: { in: ids }, status: "PUBLISHED" },
      include: productInclude,
    }),
  );
  const byId = new Map(rows.map((row) => [row.id, row]));
  const items = ids.flatMap((id) => {
    const row = byId.get(id);
    return row ? [mapProduct(row, false)] : [];
  });

  return { items, total, page: query.page, pageSize: query.pageSize };
}
