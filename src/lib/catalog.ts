import { Prisma, type ProductCondition, type StockStatus } from "@prisma/client";
import { cacheWrap } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { cardInclude, toCard, type CategoryNode, type FinderMake, type ProductCard } from "@/lib/dto";
import { searchProductIds } from "@/lib/search";

export const PAGE_SIZE = 24;

export type ListFilters = {
  q?: string;
  make?: string;
  model?: string;
  year?: number;
  engine?: string;
  category?: string;
  availability?: string;
  condition?: string;
  sort?: string;
  page?: number;
};

function baseWhere(filters: ListFilters): Prisma.ProductWhereInput[] {
  const and: Prisma.ProductWhereInput[] = [{ isPublished: true }];
  if (filters.category) {
    and.push({
      OR: [{ category: { slug: filters.category } }, { category: { parent: { slug: filters.category } } }],
    });
  }
  if (filters.make || filters.model || filters.year || filters.engine) {
    and.push({
      compatibilities: {
        some: {
          ...(filters.make ? { make: { slug: filters.make } } : {}),
          ...(filters.model ? { model: { slug: filters.model } } : {}),
          ...(filters.year ? { year: filters.year } : {}),
          ...(filters.engine ? { engine: { code: filters.engine } } : {}),
        },
      },
    });
  }
  if (filters.availability === "in_stock") {
    and.push({ stockStatus: { in: ["IN_STOCK", "US_WAREHOUSE"] }, quantity: { gt: 0 } });
  }
  if (filters.condition === "NEW" || filters.condition === "USED" || filters.condition === "REFURBISHED") {
    and.push({ condition: filters.condition });
  }
  return and;
}

function orderBy(sort?: string): Prisma.ProductOrderByWithRelationInput {
  if (sort === "price_asc") return { priceCents: { sort: "asc", nulls: "last" } };
  if (sort === "price_desc") return { priceCents: { sort: "desc", nulls: "last" } };
  return { createdAt: "desc" };
}

export async function listProducts(filters: ListFilters): Promise<{ items: ProductCard[]; total: number; page: number; pages: number }> {
  const page = Math.max(1, filters.page ?? 1);
  const and = baseWhere(filters);
  if (filters.q) {
    const ranked = await searchProductIds(filters.q);
    and.push({ id: { in: ranked.length ? ranked : ["__none__"] } });
    const rows = await prisma.product.findMany({ where: { AND: and }, include: cardInclude });
    const order = new Map(ranked.map((id, index) => [id, index]));
    rows.sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
    const total = rows.length;
    const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
    return {
      items: rows.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE).map(toCard),
      total,
      page,
      pages,
    };
  }
  const where = { AND: and };
  const [total, rows] = await Promise.all([
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      include: cardInclude,
      orderBy: orderBy(filters.sort),
      skip: (page - 1) * PAGE_SIZE,
      take: PAGE_SIZE,
    }),
  ]);
  return { items: rows.map(toCard), total, page, pages: Math.max(1, Math.ceil(total / PAGE_SIZE)) };
}

export async function getCategoryTree(): Promise<CategoryNode[]> {
  return cacheWrap("category-tree", 120, async () => {
    const rows = await prisma.category.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: { id: true, name: true, slug: true, intro: true, parentId: true },
    });
    return rows
      .filter((row) => !row.parentId)
      .map((parent) => ({
        id: parent.id,
        name: parent.name,
        slug: parent.slug,
        intro: parent.intro,
        children: rows
          .filter((row) => row.parentId === parent.id)
          .map((child) => ({ id: child.id, name: child.name, slug: child.slug, intro: child.intro })),
      }));
  });
}

export async function getFinderData(): Promise<FinderMake[]> {
  return cacheWrap("finder", 120, async () => {
    const makes = await prisma.vehicleMake.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        name: true,
        slug: true,
        models: { where: { isActive: true }, orderBy: { name: "asc" }, select: { name: true, slug: true } },
      },
    });
    return makes;
  });
}

export async function getHomeData() {
  return cacheWrap("home", 60, async () => {
    const [categories, makes, fresh, featured, fromUsa, articles, reviews, productCount] = await Promise.all([
      getCategoryTree(),
      prisma.vehicleMake.findMany({
        where: { isActive: true, isFeatured: true },
        orderBy: { sortOrder: "asc" },
        select: { name: true, slug: true, country: true },
      }),
      prisma.product.findMany({
        where: { isPublished: true },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: cardInclude,
      }),
      prisma.product.findMany({
        where: { isPublished: true, isFeatured: true },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: cardInclude,
      }),
      prisma.product.findMany({
        where: { isPublished: true, originCountry: "USA" },
        orderBy: { createdAt: "desc" },
        take: 8,
        include: cardInclude,
      }),
      prisma.article.findMany({
        where: { isPublished: true },
        orderBy: { publishedAt: "desc" },
        take: 4,
        select: { slug: true, title: true, excerpt: true, publishedAt: true },
      }),
      prisma.review.findMany({
        where: { status: "PUBLISHED" },
        orderBy: { createdAt: "desc" },
        take: 4,
        select: { id: true, authorName: true, rating: true, body: true, isDemo: true, product: { select: { name: true, slug: true } } },
      }),
      prisma.product.count({ where: { isPublished: true } }),
    ]);
    return {
      categories,
      makes,
      fresh: fresh.map(toCard),
      featured: featured.map(toCard),
      fromUsa: fromUsa.map(toCard),
      articles: articles.map((article) => ({
        ...article,
        publishedAt: article.publishedAt?.toISOString() ?? null,
      })),
      reviews,
      productCount,
    };
  });
}

export async function getProductBySlug(slug: string) {
  return prisma.product.findUnique({
    where: { slug },
    include: {
      images: { orderBy: { sortOrder: "asc" } },
      oemNumbers: { orderBy: [{ isPrimary: "desc" }, { number: "asc" }] },
      specs: { orderBy: { sortOrder: "asc" } },
      category: { include: { parent: true } },
      inventory: true,
      compatibilities: {
        include: {
          make: true,
          model: true,
          generation: true,
          engine: true,
        },
      },
      reviews: { where: { status: "PUBLISHED" }, orderBy: { createdAt: "desc" }, take: 6 },
    },
  });
}

export async function getRelated(productId: string, categoryId: string) {
  const links = await prisma.productRelation.findMany({
    where: { fromId: productId },
    include: { to: { include: cardInclude } },
  });
  const grouped = {
    SIMILAR: [] as ProductCard[],
    ANALOG: [] as ProductCard[],
    RELATED: [] as ProductCard[],
  };
  for (const link of links) {
    if (!link.to.isPublished) continue;
    if (link.type === "ANALOG" || link.type === "RELATED" || link.type === "SIMILAR") {
      grouped[link.type].push(toCard(link.to));
    }
  }
  if (!grouped.SIMILAR.length) {
    const fallback = await prisma.product.findMany({
      where: { isPublished: true, categoryId, id: { not: productId } },
      take: 4,
      include: cardInclude,
    });
    grouped.SIMILAR = fallback.map(toCard);
  }
  return grouped;
}

export async function enginesFor(make: string, model: string, year: number) {
  return prisma.engine.findMany({
    where: {
      year: {
        year,
        generation: { model: { slug: model, make: { slug: make } } },
      },
    },
    select: { code: true, name: true, fuel: true, displacementL: true },
    orderBy: { name: "asc" },
  });
}

export function parseCondition(value: string | undefined): ProductCondition | undefined {
  if (value === "NEW" || value === "USED" || value === "REFURBISHED") return value;
  return undefined;
}

export function parseStock(value: string | undefined): StockStatus | undefined {
  if (value === "IN_STOCK" || value === "US_WAREHOUSE" || value === "IN_TRANSIT" || value === "ON_ORDER" || value === "OUT_OF_STOCK") {
    return value;
  }
  return undefined;
}
