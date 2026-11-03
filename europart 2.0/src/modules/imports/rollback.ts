import "server-only";

import { z } from "zod";
import { Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { ImportFlowError } from "@/modules/imports/errors";
import { readSummary, type ImportSummary } from "@/modules/imports/report";

const snapshotSchema = z.object({
  createdProductId: z.string().optional(),
  createdOfferId: z.string().optional(),
  previousOffer: z
    .object({
      purchasePrice: z.string().nullable(),
      retailPrice: z.string().nullable(),
      b2bPrice: z.string().nullable(),
      currency: z.string().length(3),
      quantity: z.number().int(),
      reservedQuantity: z.number().int(),
      availabilityStatus: z.enum([
        "IN_STOCK",
        "LOW_STOCK",
        "ON_ORDER",
        "INCOMING",
        "OUT_OF_STOCK",
        "DISCONTINUED",
        "UNKNOWN",
      ]),
      leadTime: z.number().int().nullable(),
    })
    .optional(),
  createdCategoryIds: z.array(z.string()).default([]),
  createdBrandIds: z.array(z.string()).default([]),
  createdIdentifierIds: z.array(z.string()).default([]),
  createdImageIds: z.array(z.string()).default([]),
});

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

export const ImportRollbackService = {
  async rollback(jobId: string): Promise<ImportSummary> {
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
        if (job.status !== "COMMITTED") {
          throw new ImportFlowError("Откатить можно только применённый импорт.");
        }

        const categoryIds = new Set<string>();
        const brandIds = new Set<string>();
        const applied = [...job.rows]
          .filter((row) => row.applied)
          .sort((left, right) => right.rowNumber - left.rowNumber);

        for (const row of applied) {
          const snapshot = snapshotSchema.parse(row.snapshot ?? {});
          snapshot.createdCategoryIds.forEach((id) => categoryIds.add(id));
          snapshot.createdBrandIds.forEach((id) => brandIds.add(id));

          if (snapshot.createdProductId) {
            await tx.product.deleteMany({ where: { id: snapshot.createdProductId } });
            continue;
          }
          if (snapshot.createdImageIds.length > 0) {
            await tx.productImage.deleteMany({
              where: { id: { in: snapshot.createdImageIds } },
            });
          }
          if (snapshot.createdIdentifierIds.length > 0) {
            await tx.productIdentifier.deleteMany({
              where: { id: { in: snapshot.createdIdentifierIds } },
            });
          }
          if (snapshot.previousOffer && row.offerId) {
            await tx.productOffer.update({
              where: { id: row.offerId },
              data: snapshot.previousOffer,
            });
          } else if (snapshot.createdOfferId) {
            await tx.productOffer.deleteMany({ where: { id: snapshot.createdOfferId } });
          }
        }

        for (const categoryId of categoryIds) {
          const used = await tx.product.count({ where: { categoryId } });
          const children = await tx.category.count({ where: { parentId: categoryId } });
          if (used === 0 && children === 0) {
            await tx.category.deleteMany({ where: { id: categoryId } });
          }
        }
        for (const brandId of brandIds) {
          const products = await tx.product.count({ where: { partBrandId: brandId } });
          const identifiers = await tx.productIdentifier.count({ where: { brandId } });
          if (products === 0 && identifiers === 0) {
            await tx.partBrand.deleteMany({ where: { id: brandId } });
          }
        }

        const previous = readSummary(job.summary);
        const summary: ImportSummary = {
          total: previous?.total ?? job.rows.length,
          create: previous?.create ?? 0,
          update: previous?.update ?? 0,
          error: previous?.error ?? 0,
          duplicate: previous?.duplicate ?? 0,
          applied: 0,
          delimiter: previous?.delimiter ?? null,
          sheetCount: previous?.sheetCount ?? 1,
        };
        await tx.importJob.update({
          where: { id: job.id },
          data: { status: "ROLLED_BACK", summary: json(summary) },
        });
        await tx.auditLog.create({
          data: {
            actor: "admin",
            action: "import.rollback",
            entityType: "ImportJob",
            entityId: job.id,
            summary: `Откат импорта «${job.filename}».`,
            changes: json(summary),
          },
        });
        return summary;
      },
      { timeout: 60_000, maxWait: 10_000 },
    );
  },
};
