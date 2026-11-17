import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { rebuildPreview, ImportCommitService } from "@/modules/imports/commit";
import { ImportFlowError } from "@/modules/imports/errors";
import { parseColumnMapping } from "@/modules/imports/fields";
import { ImportParser, type ImportDelimiter } from "@/modules/imports/parser";
import type { ImportSummary } from "@/modules/imports/report";
import { ImportRollbackService } from "@/modules/imports/rollback";

function json(value: unknown): Prisma.InputJsonValue {
  return value as Prisma.InputJsonValue;
}

function safeFilename(filename: string): string {
  const base =
    filename
      .split(/[/\\]/)
      .pop()
      ?.replace(/[^\p{L}\p{N}._ -]+/gu, "") ?? "price";
  return base.slice(0, 180) || "price";
}

async function assertTarget(input: {
  sourceType: "OWN_STOCK" | "SUPPLIER";
  supplierId: string | null;
  warehouseId: string | null;
}): Promise<void> {
  const prisma = getPrismaClient();
  if (input.sourceType === "SUPPLIER") {
    if (!input.supplierId) {
      throw new ImportFlowError("Выберите поставщика.");
    }
    const supplier = await prisma.supplier.findUnique({
      where: { id: input.supplierId },
    });
    if (!supplier || !supplier.isActive) {
      throw new ImportFlowError("Поставщик не найден или отключён.");
    }
    if (input.warehouseId) {
      const warehouse = await prisma.warehouse.findUnique({
        where: { id: input.warehouseId },
      });
      if (
        !warehouse ||
        !warehouse.isActive ||
        warehouse.type !== "SUPPLIER" ||
        warehouse.supplierId !== supplier.id
      ) {
        throw new ImportFlowError("Склад не принадлежит этому поставщику.");
      }
    }
    return;
  }
  if (input.supplierId) {
    throw new ImportFlowError("Для своего склада поставщик не выбирается.");
  }
  if (!input.warehouseId) {
    throw new ImportFlowError("Выберите свой склад.");
  }
  const warehouse = await prisma.warehouse.findUnique({
    where: { id: input.warehouseId },
  });
  if (!warehouse || !warehouse.isActive || warehouse.type !== "OWN") {
    throw new ImportFlowError("Нужен действующий собственный склад.");
  }
}

export const ImportPreviewService = {
  build: rebuildPreview,
};

export const ImportService = {
  async upload(input: {
    filename: string;
    bytes: Uint8Array;
    delimiter: ImportDelimiter;
    sourceType: "OWN_STOCK" | "SUPPLIER";
    supplierId: string | null;
    warehouseId: string | null;
    templateId: string | null;
  }): Promise<{ id: string }> {
    await assertTarget(input);
    const parsed = await ImportParser.parse(input);
    const prisma = getPrismaClient();
    if (input.templateId) {
      const template = await prisma.importTemplate.findUnique({
        where: { id: input.templateId },
      });
      if (!template || template.supplierId !== input.supplierId) {
        throw new ImportFlowError("Шаблон не относится к выбранному поставщику.");
      }
    }
    const job = await prisma.importJob.create({
      data: {
        supplierId: input.supplierId,
        warehouseId: input.warehouseId,
        templateId: input.templateId,
        sourceType: input.sourceType,
        filename: safeFilename(input.filename),
        status: "UPLOADED",
        headers: json(parsed.headers),
        rawRows: json({ rows: parsed.rows }),
        summary: json({
          total: parsed.rows.length,
          create: 0,
          update: 0,
          error: 0,
          duplicate: 0,
          applied: 0,
          delimiter: parsed.delimiter,
          sheetCount: parsed.sheetCount,
        }),
      },
      select: { id: true },
    });
    await prisma.auditLog.create({
      data: {
        actor: "admin",
        action: "import.upload",
        entityType: "ImportJob",
        entityId: job.id,
        summary: `Загружен файл «${safeFilename(input.filename)}». Товары ещё не изменены.`,
      },
    });
    return job;
  },

  preview(jobId: string, mapping: unknown): Promise<ImportSummary> {
    return rebuildPreview(jobId, mapping);
  },

  commit(jobId: string): Promise<ImportSummary> {
    return ImportCommitService.commit(jobId);
  },

  rollback(jobId: string): Promise<ImportSummary> {
    return ImportRollbackService.rollback(jobId);
  },

  async saveTemplate(input: {
    supplierId: string;
    name: string;
    mapping: unknown;
    headers: string[];
    delimiter: ImportDelimiter;
  }) {
    const name = input.name.trim();
    if (name.length < 2 || name.length > 80) {
      throw new ImportFlowError("Название шаблона — от 2 до 80 символов.");
    }
    const mapping = parseColumnMapping(input.mapping, input.headers);
    return getPrismaClient().importTemplate.upsert({
      where: { supplierId_name: { supplierId: input.supplierId, name } },
      create: {
        supplierId: input.supplierId,
        name,
        mapping: json(mapping),
        options: json({ delimiter: input.delimiter }),
      },
      update: {
        mapping: json(mapping),
        options: json({ delimiter: input.delimiter }),
      },
    });
  },
};
