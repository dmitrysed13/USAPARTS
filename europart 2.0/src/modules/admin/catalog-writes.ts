import "server-only";

import { z } from "zod";
import type { Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import { writeAudit } from "@/modules/admin/audit";
import { parseMoney } from "@/modules/imports/money";
import { normalizeArticle } from "@/modules/search/normalize-article";

const productSchema = z.object({
  name: z.string().trim().min(2).max(300),
  description: z.string().trim().max(5000).optional(),
  categoryId: z.string().uuid(),
  partBrandId: z.string().uuid().nullable().optional(),
  article: z.string().trim().max(80).optional(),
  oem: z.string().trim().max(80).optional(),
  condition: z.enum(["NEW", "USED"]),
  productType: z.enum(["ORIGINAL", "ANALOG"]),
  status: z.enum(["DRAFT", "PUBLISHED", "ARCHIVED"]).optional(),
});

const offerSchema = z.object({
  productId: z.string().uuid(),
  sourceType: z.enum(["OWN_STOCK", "SUPPLIER"]),
  supplierId: z.string().uuid().nullable(),
  warehouseId: z.string().uuid().nullable(),
  purchasePrice: z.string().optional(),
  retailPrice: z.string().optional(),
  b2bPrice: z.string().optional(),
  currency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/),
  quantity: z.number().int().min(0).max(1_000_000),
  availabilityStatus: z.enum([
    "IN_STOCK",
    "LOW_STOCK",
    "ON_ORDER",
    "INCOMING",
    "OUT_OF_STOCK",
    "DISCONTINUED",
    "UNKNOWN",
  ]),
  leadTime: z.number().int().min(0).max(365).nullable(),
});

async function uniqueProductSlug(base: string): Promise<string> {
  const prisma = getPrismaClient();
  let slug = base;
  let suffix = 2;
  while (await prisma.product.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base.slice(0, 70)}-${suffix}`;
    suffix += 1;
  }
  return slug;
}

function articlePair(value: string | undefined): {
  raw: string | null;
  normalized: string | null;
} {
  const raw = value?.trim() || "";
  if (!raw) {
    return { raw: null, normalized: null };
  }
  const normalized = normalizeArticle(raw);
  if (!normalized) {
    throw new Error("Артикул или OEM не содержит букв и цифр.");
  }
  return { raw, normalized };
}

async function ensureIdentifier(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    value: string;
    normalized: string;
    type: "ARTICLE" | "OEM";
    brandId: string | null;
  },
) {
  await tx.productIdentifier.upsert({
    where: {
      productId_type_normalizedValue: {
        productId: input.productId,
        type: input.type,
        normalizedValue: input.normalized,
      },
    },
    create: {
      productId: input.productId,
      value: input.value,
      normalizedValue: input.normalized,
      type: input.type,
      isPrimary: true,
      brandId: input.type === "ARTICLE" ? input.brandId : null,
    },
    update: { value: input.value },
  });
}

export async function listAdminProducts(query: string) {
  const prisma = getPrismaClient();
  const q = query.trim();
  return prisma.product.findMany({
    where: q
      ? {
          OR: [
            { name: { contains: q, mode: "insensitive" } },
            { article: { contains: q, mode: "insensitive" } },
            { oem: { contains: q, mode: "insensitive" } },
          ],
        }
      : undefined,
    orderBy: { updatedAt: "desc" },
    take: 100,
    include: {
      category: { select: { name: true } },
      partBrand: { select: { name: true } },
    },
  });
}

export async function getAdminProduct(id: string) {
  return getPrismaClient().product.findUnique({
    where: { id },
    include: {
      category: true,
      partBrand: true,
      identifiers: { orderBy: { type: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      offers: {
        orderBy: { updatedAt: "desc" },
        include: {
          supplier: { select: { name: true } },
          warehouse: { select: { name: true } },
        },
      },
    },
  });
}

export async function createProduct(input: z.input<typeof productSchema>) {
  const result = productSchema.safeParse({ ...input, status: input.status ?? "DRAFT" });
  if (!result.success) {
    throw new Error("Проверьте название, категорию и артикул.");
  }
  const parsed = result.data;
  const article = articlePair(parsed.article);
  const oem = articlePair(parsed.oem);
  const prisma = getPrismaClient();
  const category = await prisma.category.findUnique({ where: { id: parsed.categoryId } });
  if (!category) {
    throw new Error("Категория не найдена.");
  }
  const slug = await uniqueProductSlug(
    slugify([parsed.name, article.raw].filter(Boolean).join(" "), "tovar"),
  );
  const product = await prisma.$transaction(async (tx) => {
    const created = await tx.product.create({
      data: {
        name: parsed.name,
        slug,
        description: parsed.description || null,
        categoryId: parsed.categoryId,
        partBrandId: parsed.partBrandId || null,
        article: article.raw,
        articleNormalized: article.normalized,
        oem: oem.raw,
        condition: parsed.condition,
        productType: parsed.productType,
        status: parsed.status ?? "DRAFT",
      },
    });
    if (article.raw && article.normalized) {
      await ensureIdentifier(tx, {
        productId: created.id,
        value: article.raw,
        normalized: article.normalized,
        type: "ARTICLE",
        brandId: parsed.partBrandId || null,
      });
    }
    if (oem.raw && oem.normalized) {
      await ensureIdentifier(tx, {
        productId: created.id,
        value: oem.raw,
        normalized: oem.normalized,
        type: "OEM",
        brandId: null,
      });
    }
    return created;
  });
  await writeAudit({
    action: "product.create",
    entityType: "Product",
    entityId: product.id,
    summary: `Создан товар «${product.name}» со статусом ${product.status}.`,
  });
  return product;
}

export async function updateProduct(id: string, input: z.input<typeof productSchema>) {
  const result = productSchema.safeParse(input);
  if (!result.success) {
    throw new Error("Проверьте название, категорию и артикул.");
  }
  const parsed = result.data;
  const article = articlePair(parsed.article);
  const oem = articlePair(parsed.oem);
  const product = await getPrismaClient().$transaction(async (tx) => {
    const updated = await tx.product.update({
      where: { id },
      data: {
        name: parsed.name,
        description: parsed.description || null,
        categoryId: parsed.categoryId,
        partBrandId: parsed.partBrandId || null,
        article: article.raw,
        articleNormalized: article.normalized,
        oem: oem.raw,
        condition: parsed.condition,
        productType: parsed.productType,
        status: parsed.status ?? "DRAFT",
      },
    });
    if (article.raw && article.normalized) {
      await ensureIdentifier(tx, {
        productId: id,
        value: article.raw,
        normalized: article.normalized,
        type: "ARTICLE",
        brandId: parsed.partBrandId || null,
      });
    }
    if (oem.raw && oem.normalized) {
      await ensureIdentifier(tx, {
        productId: id,
        value: oem.raw,
        normalized: oem.normalized,
        type: "OEM",
        brandId: null,
      });
    }
    return updated;
  });
  await writeAudit({
    action: "product.update",
    entityType: "Product",
    entityId: product.id,
    summary: `Обновлён товар «${product.name}», статус ${product.status}.`,
  });
  return product;
}

export async function archiveProduct(id: string) {
  const product = await getPrismaClient().product.update({
    where: { id },
    data: { status: "ARCHIVED" },
  });
  await writeAudit({
    action: "product.archive",
    entityType: "Product",
    entityId: product.id,
    summary: `Товар «${product.name}» скрыт из каталога. Карточка не удалена.`,
  });
  return product;
}

function optionalMoney(value: string | undefined, label: string): string | null {
  const text = value?.trim() ?? "";
  if (!text) {
    return null;
  }
  const parsed = parseMoney(text);
  if (!parsed.ok) {
    throw new Error(`${label}: ${parsed.message}`);
  }
  return parsed.value;
}

export async function createOffer(input: z.input<typeof offerSchema>) {
  const result = offerSchema.safeParse(input);
  if (!result.success) {
    throw new Error("Проверьте склад, цены, валюту и количество.");
  }
  const parsed = result.data;
  const prisma = getPrismaClient();
  const product = await prisma.product.findUnique({ where: { id: parsed.productId } });
  if (!product) {
    throw new Error("Товар не найден.");
  }
  if (parsed.sourceType === "OWN_STOCK") {
    if (parsed.supplierId) {
      throw new Error("У собственного остатка нет поставщика.");
    }
    if (!parsed.warehouseId) {
      throw new Error("Выберите свой склад.");
    }
    const warehouse = await prisma.warehouse.findUnique({
      where: { id: parsed.warehouseId },
    });
    if (!warehouse || warehouse.type !== "OWN" || !warehouse.isActive) {
      throw new Error("Нужен действующий собственный склад.");
    }
  } else {
    if (!parsed.supplierId) {
      throw new Error("Выберите поставщика.");
    }
    const supplier = await prisma.supplier.findUnique({
      where: { id: parsed.supplierId },
    });
    if (!supplier || !supplier.isActive) {
      throw new Error("Поставщик не найден или отключён.");
    }
    if (parsed.warehouseId) {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: parsed.warehouseId },
      });
      if (
        !warehouse ||
        warehouse.supplierId !== supplier.id ||
        warehouse.type !== "SUPPLIER"
      ) {
        throw new Error("Склад не принадлежит поставщику.");
      }
    }
  }
  const offer = await prisma.productOffer.create({
    data: {
      productId: parsed.productId,
      sourceType: parsed.sourceType,
      supplierId: parsed.sourceType === "SUPPLIER" ? parsed.supplierId : null,
      warehouseId: parsed.warehouseId,
      purchasePrice: optionalMoney(parsed.purchasePrice, "Закупка"),
      retailPrice: optionalMoney(parsed.retailPrice, "Розница"),
      b2bPrice: optionalMoney(parsed.b2bPrice, "Оптовая цена"),
      currency: parsed.currency,
      quantity: parsed.quantity,
      availabilityStatus: parsed.availabilityStatus,
      leadTime: parsed.leadTime,
    },
  });
  await writeAudit({
    action: "offer.create",
    entityType: "ProductOffer",
    entityId: offer.id,
    summary: `Добавлено предложение для «${product.name}». Закупка видна только в админке.`,
  });
  return offer;
}

export async function listCategories() {
  return getPrismaClient().category.findMany({
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
    include: { parent: { select: { name: true } } },
  });
}

export async function createCategory(input: { name: string; parentId: string | null }) {
  const name = input.name.trim();
  if (name.length < 2 || name.length > 160) {
    throw new Error("Название категории — от 2 до 160 символов.");
  }
  const prisma = getPrismaClient();
  if (input.parentId) {
    const parent = await prisma.category.findUnique({ where: { id: input.parentId } });
    if (!parent) {
      throw new Error("Родительская категория не найдена.");
    }
  }
  const base = slugify(name, "kategoriya");
  let slug = base;
  let suffix = 2;
  while (await prisma.category.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base.slice(0, 70)}-${suffix}`;
    suffix += 1;
  }
  const category = await prisma.category.create({
    data: { name, slug, parentId: input.parentId },
  });
  await writeAudit({
    action: "category.create",
    entityType: "Category",
    entityId: category.id,
    summary: `Добавлена категория «${category.name}».`,
  });
  return category;
}

export async function listPartBrands() {
  return getPrismaClient().partBrand.findMany({ orderBy: { name: "asc" } });
}

export async function createPartBrand(name: string) {
  const label = name.trim();
  if (label.length < 2 || label.length > 120) {
    throw new Error("Название бренда — от 2 до 120 символов.");
  }
  const prisma = getPrismaClient();
  const base = slugify(label, "brand");
  let slug = base;
  let suffix = 2;
  while (await prisma.partBrand.findUnique({ where: { slug }, select: { id: true } })) {
    slug = `${base.slice(0, 70)}-${suffix}`;
    suffix += 1;
  }
  const brand = await prisma.partBrand.create({ data: { name: label, slug } });
  await writeAudit({
    action: "partBrand.create",
    entityType: "PartBrand",
    entityId: brand.id,
    summary: `Добавлен бренд запчасти «${brand.name}».`,
  });
  return brand;
}
