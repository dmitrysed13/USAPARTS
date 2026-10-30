import type { ProductCondition, StockStatus } from "@prisma/client";

export type ProductCard = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  condition: ProductCondition;
  stockStatus: StockStatus;
  priceCents: number | null;
  currency: string;
  quantity: number;
  isDemo: boolean;
  allowBackorder: boolean;
  oem: string | null;
  manufacturer: string | null;
  image: { id: string; alt: string; width: number; height: number } | null;
  fitment: string | null;
  categoryName: string;
  categorySlug: string;
  parentSlug: string | null;
};

export type CategoryNode = {
  id: string;
  name: string;
  slug: string;
  intro: string | null;
  children: { id: string; name: string; slug: string; intro: string | null }[];
};

export type FinderMake = {
  name: string;
  slug: string;
  models: { name: string; slug: string }[];
};

type FitmentSource = {
  year: number | null;
  make: { name: string };
  model: { name: string } | null;
};

export function fitmentLabel(row: FitmentSource | undefined) {
  if (!row) return null;
  return [row.make.name, row.model?.name, row.year ?? null].filter(Boolean).join(" ");
}

export const cardInclude = {
  images: { orderBy: { sortOrder: "asc" as const }, take: 1 },
  oemNumbers: { where: { isPrimary: true }, take: 1 },
  category: { select: { name: true, slug: true, parent: { select: { slug: true } } } },
  compatibilities: {
    take: 1,
    include: { make: { select: { name: true } }, model: { select: { name: true } } },
  },
};

type CardSource = {
  id: string;
  sku: string;
  slug: string;
  name: string;
  condition: ProductCondition;
  stockStatus: StockStatus;
  priceCents: number | null;
  currency: string;
  quantity: number;
  isDemo: boolean;
  allowBackorder: boolean;
  manufacturer: string | null;
  images: { id: string; alt: string; width: number; height: number }[];
  oemNumbers: { number: string }[];
  category: { name: string; slug: string; parent: { slug: string } | null };
  compatibilities: FitmentSource[];
};

export function toCard(product: CardSource): ProductCard {
  const image = product.images[0];
  return {
    id: product.id,
    sku: product.sku,
    slug: product.slug,
    name: product.name,
    condition: product.condition,
    stockStatus: product.stockStatus,
    priceCents: product.priceCents,
    currency: product.currency,
    quantity: product.quantity,
    isDemo: product.isDemo,
    allowBackorder: product.allowBackorder,
    oem: product.oemNumbers[0]?.number ?? null,
    manufacturer: product.manufacturer,
    image: image ? { id: image.id, alt: image.alt, width: image.width, height: image.height } : null,
    fitment: fitmentLabel(product.compatibilities[0]),
    categoryName: product.category.name,
    categorySlug: product.category.slug,
    parentSlug: product.category.parent?.slug ?? null,
  };
}

export function canPurchase(product: {
  priceCents: number | null;
  stockStatus: string;
  quantity: number;
  allowBackorder: boolean;
}) {
  if (product.priceCents == null) return false;
  if (product.stockStatus === "OUT_OF_STOCK" && !product.allowBackorder) return false;
  if (
    product.quantity <= 0 &&
    !product.allowBackorder &&
    product.stockStatus !== "ON_ORDER" &&
    product.stockStatus !== "IN_TRANSIT"
  ) {
    return false;
  }
  return true;
}
