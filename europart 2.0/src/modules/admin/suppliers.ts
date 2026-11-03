import "server-only";

import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";
import { writeAudit } from "@/modules/admin/audit";
import { ImportFlowError } from "@/modules/imports/errors";

const supplierSchema = z.object({
  name: z.string().trim().min(2).max(160),
  code: z
    .string()
    .trim()
    .toLowerCase()
    .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/)
    .max(60),
  email: z.union([z.literal(""), z.email()]).optional(),
  phone: z.string().trim().max(40).optional(),
  note: z.string().trim().max(2000).optional(),
  apiEnabled: z.boolean().optional(),
  credentialsEnvKey: z
    .union([
      z
        .string()
        .trim()
        .regex(/^[A-Z][A-Z0-9_]{2,60}$/),
      z.literal(""),
    ])
    .optional(),
});

export type SupplierInput = z.input<typeof supplierSchema>;

function clean(input: SupplierInput) {
  const parsed = supplierSchema.parse(input);
  return {
    name: parsed.name,
    code: parsed.code,
    email: parsed.email || null,
    phone: parsed.phone || null,
    note: parsed.note || null,
    apiEnabled: parsed.apiEnabled ?? false,
    credentialsEnvKey: parsed.credentialsEnvKey || null,
  };
}

async function uniqueCode(name: string): Promise<string> {
  const prisma = getPrismaClient();
  const base = slugify(name, "supplier");
  let code = base;
  let suffix = 2;
  while (await prisma.supplier.findUnique({ where: { code }, select: { id: true } })) {
    code = `${base.slice(0, 50)}-${suffix}`;
    suffix += 1;
  }
  return code;
}

export async function listSuppliers() {
  return getPrismaClient().supplier.findMany({
    orderBy: { name: "asc" },
    include: { importTemplates: { orderBy: { name: "asc" } } },
  });
}

export async function getSupplier(id: string) {
  return getPrismaClient().supplier.findUnique({
    where: { id },
    include: { importTemplates: { orderBy: { name: "asc" } }, warehouses: true },
  });
}

export async function createSupplier(input: SupplierInput) {
  const data = clean({ ...input, code: input.code || (await uniqueCode(input.name)) });
  const supplier = await getPrismaClient().supplier.create({ data });
  await writeAudit({
    action: "supplier.create",
    entityType: "Supplier",
    entityId: supplier.id,
    summary: `Добавлен поставщик «${supplier.name}».`,
  });
  return supplier;
}

export async function updateSupplier(
  id: string,
  input: SupplierInput & { isActive?: boolean },
) {
  const data = clean(input);
  const supplier = await getPrismaClient().supplier.update({
    where: { id },
    data: { ...data, isActive: input.isActive ?? true },
  });
  await writeAudit({
    action: "supplier.update",
    entityType: "Supplier",
    entityId: supplier.id,
    summary: supplier.isActive
      ? `Обновлён поставщик «${supplier.name}».`
      : `Поставщик «${supplier.name}» отключён. Записи не удалены.`,
  });
  return supplier;
}

export async function deactivateSupplier(id: string) {
  const supplier = await getPrismaClient().supplier.update({
    where: { id },
    data: { isActive: false },
  });
  await writeAudit({
    action: "supplier.deactivate",
    entityType: "Supplier",
    entityId: supplier.id,
    summary: `Поставщик «${supplier.name}» отключён.`,
  });
  return supplier;
}

export function supplierError(error: unknown): string {
  if (error instanceof z.ZodError) {
    return "Проверьте название, код, почту и имя переменной API.";
  }
  if (error instanceof ImportFlowError) {
    return error.message;
  }
  if (error && typeof error === "object" && "code" in error && error.code === "P2002") {
    return "Поставщик с таким кодом уже есть.";
  }
  throw error;
}
