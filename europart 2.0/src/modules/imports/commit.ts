import "server-only";

import { Prisma, type OfferAvailability } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import { loadMatchCandidates } from "@/modules/imports/candidates";
import { ImportFlowError } from "@/modules/imports/errors";
import { parseColumnMapping } from "@/modules/imports/fields";
import { normalizeArticle } from "@/modules/search/normalize-article";
import type { NormalizedRow } from "@/modules/imports/normalizer";
import { buildImportPreview } from "@/modules/imports/preview";
import { readSummary, type ImportSummary } from "@/modules/imports/report";
import { readStoredTable } from "@/modules/imports/stored-file";

type Snapshot = {
  createdProductId?: string;
  createdOfferId?: string;
  previousOffer?: {
    purchasePrice: string | null;
    retailPrice: string | null;
    b2bPrice: string | null;
    currency: string;
    quantity: number;
    reservedQuantity: number;
    availabilityStatus: OfferAvailability;
    leadTime: number | null;
  };
  createdCategoryIds: string[];
  createdBrandIds: string[];
  createdIdentifierIds: string[];
  createdImageIds: string[];
};

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function money(value: { toFixed(digits: number): string } | null): string | null {
  return value ? value.toFixed(2) : null;
}

async function uniqueSlug(
  tx: Prisma.TransactionClient,
  model: "product" | "category" | "partBrand",
  base: string,
): Promise<string> {
  let slug = base;
  let suffix = 2;
  while (suffix < 60) {
    const existing =
      model === "product"
        ? await tx.product.findUnique({ where: { slug }, select: { id: true } })
        : model === "category"
          ? await tx.category.findUnique({ where: { slug }, select: { id: true } })
          : await tx.partBrand.findUnique({ where: { slug }, select: { id: true } });
    if (!existing) {
      return slug;
    }
    slug = `${base.slice(0, 70)}-${suffix}`;
    suffix += 1;
  }
  throw new ImportFlowError("Не удалось подобрать уникальный адрес.");
}

async function ensureCategory(
  tx: Prisma.TransactionClient,
  name: string | null,
  created: Set<string>,
): Promise<string> {
  const label = name?.trim() || "Без категории";
  const base = slugify(label, "bez-kategorii");
  const existing = await tx.category.findFirst({
    where: { OR: [{ name: label }, { slug: base }] },
    select: { id: true },
  });
  if (existing) {
    return existing.id;
  }
  const slug = await uniqueSlug(tx, "category", base);
  const category = await tx.category.create({ data: { name: label, slug } });
  created.add(category.id);
  return category.id;
}

async function ensureBrand(
  tx: Prisma.TransactionClient,
  name: string,
  created: Set<string>,
): Promise<string> {
  const base = slugify(name, "brand");
  const existing = await tx.partBrand.findFirst({
    where: { OR: [{ name }, { slug: base }] },
    select: { id: true },
  });
  if (existing) {
    return existing.id;
  }
  const slug = await uniqueSlug(tx, "partBrand", base);
  const brand = await tx.partBrand.create({ data: { name, slug } });
  created.add(brand.id);
  return brand.id;
}

async function addIdentifier(
  tx: Prisma.TransactionClient,
  input: {
    productId: string;
    value: string;
    normalized: string;
    type: "OEM" | "ARTICLE" | "CROSS_REFERENCE";
    brandId: string | null;
  },
  created: string[],
): Promise<void> {
  const existing = await tx.productIdentifier.findUnique({
    where: {
      productId_type_normalizedValue: {
        productId: input.productId,
        type: input.type,
        normalizedValue: input.normalized,
      },
    },
    select: { id: true },
  });
  if (existing) {
    return;
  }
  const identifier = await tx.productIdentifier.create({
    data: {
      productId: input.productId,
      value: input.value,
      normalizedValue: input.normalized,
      type: input.type,
      isPrimary: input.type !== "CROSS_REFERENCE",
      brandId: input.brandId,
    },
  });
  created.push(identifier.id);
}

async function addImage(
  tx: Prisma.TransactionClient,
  productId: string,
  url: string,
  alt: string,
  created: string[],
): Promise<void> {
  const existing = await tx.productImage.findFirst({
    where: { productId, url },
    select: { id: true },
  });
  if (existing) {
    return;
  }
  const image = await tx.productImage.create({
    data: { productId, url, alt, sortOrder: 0 },
  });
  created.push(image.id);
}

function offerPatch(row: NormalizedRow): {
  purchasePrice?: string;
  retailPrice?: string;
  currency?: string;
  quantity?: number;
  availabilityStatus?: OfferAvailability;
  leadTime?: number;
} {
  return {
    ...(row.provided.purchasePrice && row.purchasePrice
      ? { purchasePrice: row.purchasePrice }
      : {}),
    ...(row.provided.retailPrice && row.retailPrice
      ? { retailPrice: row.retailPrice }
      : {}),
    ...(row.provided.currency && row.currency ? { currency: row.currency } : {}),
    ...(row.provided.quantity && row.quantity !== null ? { quantity: row.quantity } : {}),
    ...(row.provided.availability && row.availability
      ? { availabilityStatus: row.availability }
      : {}),
    ...(row.provided.leadTime && row.leadTime !== null ? { leadTime: row.leadTime } : {}),
  };
}

export const ImportCommitService = {
  async commit(jobId: string): Promise<ImportSummary> {
    const prisma = getPrismaClient();
    return prisma.$transaction(
      async (tx) => {
        await tx.$queryRaw(
          Prisma.sql`SELECT id FROM "ImportJob" WHERE id = CAST(${jobId} AS uuid) FOR UPDATE`,
        );
        const job = await tx.importJob.findUnique({
          where: { id: jobId },
          include: { rows: true },
        });
        if (!job) {
          throw new ImportFlowError("Импорт не найден.");
        }
        if (job.status !== "READY") {
          throw new ImportFlowError(
            "Сначала сформируйте предпросмотр. Уже применённый импорт повторно не записывается.",
          );
        }
        const actionable = job.rows.filter(
          (row) => row.action === "CREATE" || row.action === "UPDATE",
        );
        if (actionable.length === 0) {
          throw new ImportFlowError("Нет строк, которые можно применить.");
        }

        let applied = 0;
        for (const row of actionable) {
          const normalized = row.normalized as NormalizedRow;
          const createdCategories = new Set<string>();
          const createdBrands = new Set<string>();
          const createdIdentifiers: string[] = [];
          const createdImages: string[] = [];
          const snapshot: Snapshot = {
            createdCategoryIds: [],
            createdBrandIds: [],
            createdIdentifierIds: createdIdentifiers,
            createdImageIds: createdImages,
          };

          let productId = row.productId;
          let brandId: string | null = null;
          if (row.action === "CREATE") {
            if (!normalized.name) {
              throw new ImportFlowError(`Строка ${row.rowNumber}: нет названия.`);
            }
            const categoryId = await ensureCategory(
              tx,
              normalized.category,
              createdCategories,
            );
            brandId = normalized.partBrand
              ? await ensureBrand(tx, normalized.partBrand, createdBrands)
              : null;
            const slug = await uniqueSlug(
              tx,
              "product",
              slugify(
                [normalized.partBrand, normalized.name, normalized.article]
                  .filter(Boolean)
                  .join(" "),
                "tovar",
              ),
            );
            const product = await tx.product.create({
              data: {
                name: normalized.name,
                slug,
                description: normalized.description,
                categoryId,
                partBrandId: brandId,
                article: normalized.article,
                articleNormalized: normalized.articleNormalized,
                oem: normalized.oem,
                condition: "NEW",
                productType: "ANALOG",
                status: "DRAFT",
              },
            });
            productId = product.id;
            snapshot.createdProductId = product.id;
          } else if (productId) {
            const current = await tx.product.findUnique({
              where: { id: productId },
              select: { article: true, articleNormalized: true, oem: true, name: true },
            });
            if (!current) {
              throw new ImportFlowError(`Строка ${row.rowNumber}: товар уже удалён.`);
            }
            await tx.product.update({
              where: { id: productId },
              data: {
                article: current.article ?? normalized.article,
                articleNormalized:
                  current.articleNormalized ?? normalized.articleNormalized,
                oem: current.oem ?? normalized.oem,
              },
            });
          }

          if (!productId) {
            throw new ImportFlowError(`Строка ${row.rowNumber}: товар не сопоставлен.`);
          }

          if (normalized.article && normalized.articleNormalized) {
            await addIdentifier(
              tx,
              {
                productId,
                value: normalized.article,
                normalized: normalized.articleNormalized,
                type: "ARTICLE",
                brandId,
              },
              createdIdentifiers,
            );
          }
          if (normalized.oem && normalized.oemNormalized) {
            await addIdentifier(
              tx,
              {
                productId,
                value: normalized.oem,
                normalized: normalized.oemNormalized,
                type: "OEM",
                brandId: null,
              },
              createdIdentifiers,
            );
          }
          if (normalized.extraArticle && normalized.extraNormalized) {
            await addIdentifier(
              tx,
              {
                productId,
                value: normalized.extraArticle,
                normalized: normalized.extraNormalized,
                type: "CROSS_REFERENCE",
                brandId,
              },
              createdIdentifiers,
            );
          }
          if (normalized.imageUrl) {
            await addImage(
              tx,
              productId,
              normalized.imageUrl,
              normalized.name ?? normalized.article ?? "Фото товара",
              createdImages,
            );
          }

          const existingOffer = await tx.productOffer.findFirst({
            where: {
              productId,
              sourceType: job.sourceType,
              supplierId: job.supplierId,
              warehouseId: job.warehouseId,
            },
            orderBy: { updatedAt: "desc" },
          });
          if (
            existingOffer &&
            normalized.quantity !== null &&
            normalized.quantity < existingOffer.reservedQuantity
          ) {
            throw new ImportFlowError(
              `Строка ${row.rowNumber}: количество меньше резерва ${existingOffer.reservedQuantity}.`,
            );
          }

          let offerId = existingOffer?.id ?? null;
          if (existingOffer) {
            snapshot.previousOffer = {
              purchasePrice: money(existingOffer.purchasePrice),
              retailPrice: money(existingOffer.retailPrice),
              b2bPrice: money(existingOffer.b2bPrice),
              currency: existingOffer.currency.trim(),
              quantity: existingOffer.quantity,
              reservedQuantity: existingOffer.reservedQuantity,
              availabilityStatus: existingOffer.availabilityStatus,
              leadTime: existingOffer.leadTime,
            };
            await tx.productOffer.update({
              where: { id: existingOffer.id },
              data: offerPatch(normalized),
            });
          } else {
            const createdOffer = await tx.productOffer.create({
              data: {
                productId,
                sourceType: job.sourceType,
                supplierId: job.supplierId,
                warehouseId: job.warehouseId,
                purchasePrice:
                  normalized.provided.purchasePrice && normalized.purchasePrice
                    ? normalized.purchasePrice
                    : null,
                retailPrice:
                  normalized.provided.retailPrice && normalized.retailPrice
                    ? normalized.retailPrice
                    : null,
                currency: normalized.currency ?? "BYN",
                quantity: normalized.quantity ?? 0,
                availabilityStatus: normalized.availability ?? "UNKNOWN",
                leadTime: normalized.leadTime,
              },
            });
            offerId = createdOffer.id;
            snapshot.createdOfferId = createdOffer.id;
          }

          snapshot.createdCategoryIds = [...createdCategories];
          snapshot.createdBrandIds = [...createdBrands];
          await tx.importRow.update({
            where: { id: row.id },
            data: {
              productId,
              offerId,
              applied: true,
              snapshot: json(snapshot),
            },
          });
          applied += 1;
        }

        const previous = readSummary(job.summary);
        const summary: ImportSummary = {
          total: previous?.total ?? job.rows.length,
          create: previous?.create ?? 0,
          update: previous?.update ?? 0,
          error: previous?.error ?? 0,
          duplicate: previous?.duplicate ?? 0,
          applied,
          delimiter: previous?.delimiter ?? null,
          sheetCount: previous?.sheetCount ?? 1,
        };
        await tx.importJob.update({
          where: { id: job.id },
          data: { status: "COMMITTED", summary: json(summary) },
        });
        await tx.auditLog.create({
          data: {
            actor: "admin",
            action: "import.commit",
            entityType: "ImportJob",
            entityId: job.id,
            summary: `Применён импорт «${job.filename}»: записано ${applied} строк. Новые карточки остаются черновиками.`,
            changes: json(summary),
          },
        });
        return summary;
      },
      { timeout: 60_000, maxWait: 10_000 },
    );
  },
};

export async function rebuildPreview(
  jobId: string,
  mapping: unknown,
): Promise<ImportSummary> {
  const prisma = getPrismaClient();
  const job = await prisma.importJob.findUnique({ where: { id: jobId } });
  if (!job) {
    throw new ImportFlowError("Импорт не найден.");
  }
  if (job.status === "COMMITTED" || job.status === "ROLLED_BACK") {
    throw new ImportFlowError("Этот импорт уже завершён. Загрузите файл заново.");
  }
  const table = readStoredTable(job.headers, job.rawRows, job.summary);
  const checked = parseColumnMapping(mapping, table.headers);
  const articles: string[] = [];
  const oems: string[] = [];
  for (const row of table.rows) {
    const headerIndex = (field: string) =>
      table.headers.findIndex((header) => checked[header] === field);
    const articleAt = headerIndex("article");
    const oemAt = headerIndex("oem");
    if (articleAt >= 0 && row.cells[articleAt]) {
      const value = normalizeArticle(row.cells[articleAt]);
      if (value) {
        articles.push(value);
      }
    }
    if (oemAt >= 0 && row.cells[oemAt]) {
      const value = normalizeArticle(row.cells[oemAt]);
      if (value) {
        oems.push(value);
      }
    }
  }
  const candidates = await loadMatchCandidates({ articles, oems });
  const preview = buildImportPreview(table, checked, candidates);
  await prisma.$transaction(async (tx) => {
    await tx.importRow.deleteMany({ where: { jobId } });
    if (preview.lines.length > 0) {
      await tx.importRow.createMany({
        data: preview.lines.map((line) => ({
          jobId,
          rowNumber: line.rowNumber,
          normalized: json(line.normalized),
          action: line.action,
          message: line.message,
          productId: line.productId,
        })),
      });
    }
    await tx.importJob.update({
      where: { id: jobId },
      data: {
        status: "READY",
        mapping: json(checked),
        summary: json(preview.summary),
      },
    });
    await tx.auditLog.create({
      data: {
        actor: "admin",
        action: "import.preview",
        entityType: "ImportJob",
        entityId: jobId,
        summary: `Предпросмотр «${job.filename}»: создать ${preview.summary.create}, обновить ${preview.summary.update}, ошибки ${preview.summary.error}, дубли ${preview.summary.duplicate}.`,
        changes: json(preview.summary),
      },
    });
  });
  return preview.summary;
}
