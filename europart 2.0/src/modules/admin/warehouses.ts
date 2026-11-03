import "server-only";

import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import { writeAudit } from "@/modules/admin/audit";

const warehouseSchema = z.object({
  name: z.string().trim().min(2).max(160),
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(60),
  type: z.enum(["OWN", "SUPPLIER"]),
  supplierId: z.string().uuid().nullable(),
  city: z.string().trim().max(80).optional(),
});

export async function listWarehouses() {
  return getPrismaClient().warehouse.findMany({
    orderBy: { name: "asc" },
    include: { supplier: { select: { name: true } } },
  });
}

export async function createWarehouse(input: z.input<typeof warehouseSchema>) {
  const result = warehouseSchema.safeParse(input);
  if (!result.success) {
    throw new Error(
      "Проверьте название и код склада. Код пишется латиницей, цифрами и дефисами.",
    );
  }
  const parsed = result.data;
  if (parsed.type === "OWN" && parsed.supplierId) {
    throw new Error("Своему складу не назначается поставщик.");
  }
  if (parsed.type === "SUPPLIER" && !parsed.supplierId) {
    throw new Error("Для склада поставщика выберите поставщика.");
  }
  if (parsed.supplierId) {
    const supplier = await getPrismaClient().supplier.findUnique({
      where: { id: parsed.supplierId },
    });
    if (!supplier || !supplier.isActive) {
      throw new Error("Поставщик не найден или отключён.");
    }
  }
  const warehouse = await getPrismaClient().warehouse.create({
    data: {
      name: parsed.name,
      code: parsed.code || slugify(parsed.name, "warehouse"),
      type: parsed.type,
      supplierId: parsed.type === "SUPPLIER" ? parsed.supplierId : null,
      city: parsed.city || null,
    },
  });
  await writeAudit({
    action: "warehouse.create",
    entityType: "Warehouse",
    entityId: warehouse.id,
    summary: `Добавлен склад «${warehouse.name}».`,
  });
  return warehouse;
}

export async function deactivateWarehouse(id: string) {
  const warehouse = await getPrismaClient().warehouse.update({
    where: { id },
    data: { isActive: false },
  });
  await writeAudit({
    action: "warehouse.deactivate",
    entityType: "Warehouse",
    entityId: warehouse.id,
    summary: `Склад «${warehouse.name}» отключён. Остатки не удалены.`,
  });
  return warehouse;
}
