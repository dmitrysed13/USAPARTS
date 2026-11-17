import "server-only";

import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import { writeAudit } from "@/modules/admin/audit";
import {
  selectMarkupRule,
  type MarkupRuleMatch,
} from "@/modules/commerce/retail-pricing";

const ruleSchema = z.object({
  name: z.string().trim().min(2).max(120),
  scope: z.enum(["GLOBAL", "CATEGORY", "SUPPLIER", "PART_BRAND"]),
  categoryId: z.string().uuid().nullable().optional(),
  supplierId: z.string().uuid().nullable().optional(),
  partBrandId: z.string().uuid().nullable().optional(),
  markupType: z.enum(["PERCENT", "FIXED"]),
  value: z.number(),
  b2bValue: z.number().nullable().optional(),
  priority: z.number().int().min(1).max(10_000).optional(),
  isActive: z.boolean().optional(),
});

export async function listMarkupRules() {
  return getPrismaClient().markupRule.findMany({
    orderBy: [{ priority: "asc" }, { name: "asc" }],
  });
}

export async function createMarkupRule(input: z.input<typeof ruleSchema>) {
  const parsed = ruleSchema.parse(input);
  if (parsed.scope === "CATEGORY" && !parsed.categoryId) {
    throw new Error("Для правила категории укажите categoryId.");
  }
  if (parsed.scope === "SUPPLIER" && !parsed.supplierId) {
    throw new Error("Для правила поставщика укажите supplierId.");
  }
  if (parsed.scope === "PART_BRAND" && !parsed.partBrandId) {
    throw new Error("Для правила бренда укажите partBrandId.");
  }
  if (parsed.markupType === "PERCENT" && parsed.value < -100) {
    throw new Error("Процентная наценка не может быть меньше −100.");
  }
  const rule = await getPrismaClient().markupRule.create({
    data: {
      name: parsed.name,
      scope: parsed.scope,
      categoryId: parsed.categoryId ?? null,
      supplierId: parsed.supplierId ?? null,
      partBrandId: parsed.partBrandId ?? null,
      markupType: parsed.markupType,
      value: parsed.value,
      b2bValue: parsed.b2bValue ?? null,
      priority: parsed.priority ?? 100,
      isActive: parsed.isActive ?? true,
    },
  });
  await writeAudit({
    action: "markup.create",
    entityType: "MarkupRule",
    entityId: rule.id,
    summary: `Правило наценки «${rule.name}» (${rule.scope}).`,
  });
  return rule;
}

export async function findMarkupRulesForOffer(input: {
  categoryId: string | null;
  supplierId: string | null;
  partBrandId: string | null;
}): Promise<MarkupRuleMatch[]> {
  const rows = await getPrismaClient().markupRule.findMany({
    where: {
      isActive: true,
      OR: [
        { scope: "GLOBAL" },
        ...(input.categoryId
          ? [{ scope: "CATEGORY" as const, categoryId: input.categoryId }]
          : []),
        ...(input.supplierId
          ? [{ scope: "SUPPLIER" as const, supplierId: input.supplierId }]
          : []),
        ...(input.partBrandId
          ? [{ scope: "PART_BRAND" as const, partBrandId: input.partBrandId }]
          : []),
      ],
    },
  });
  const matches: MarkupRuleMatch[] = rows.map((row) => ({
    id: row.id,
    name: row.name,
    scope: row.scope,
    markupType: row.markupType,
    value: Number(row.value.toString()),
    b2bValue: row.b2bValue === null ? null : Number(row.b2bValue.toString()),
    priority: row.priority,
  }));
  const best = selectMarkupRule(matches);
  return best ? [best] : [];
}
