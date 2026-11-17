import "server-only";

import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import { writeAudit } from "@/modules/admin/audit";

const fxSchema = z.object({
  baseCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/),
  quoteCurrency: z
    .string()
    .trim()
    .toUpperCase()
    .regex(/^[A-Z]{3}$/)
    .default("BYN"),
  rate: z.number().positive(),
  source: z.string().trim().min(2).max(120),
  effectiveFrom: z.coerce.date(),
  effectiveTo: z.coerce.date().nullable().optional(),
});

export async function listFxRates() {
  return getPrismaClient().fxRate.findMany({
    orderBy: [{ baseCurrency: "asc" }, { effectiveFrom: "desc" }],
    take: 200,
  });
}

export async function findActiveFxRate(
  baseCurrency: string,
  quoteCurrency = "BYN",
  at: Date = new Date(),
): Promise<{ rate: number; source: string; effectiveFrom: Date } | null> {
  const base = baseCurrency.trim().toUpperCase();
  const quote = quoteCurrency.trim().toUpperCase();
  if (base === quote) {
    return { rate: 1, source: "identity", effectiveFrom: at };
  }
  const row = await getPrismaClient().fxRate.findFirst({
    where: {
      baseCurrency: base,
      quoteCurrency: quote,
      effectiveFrom: { lte: at },
      OR: [{ effectiveTo: null }, { effectiveTo: { gt: at } }],
    },
    orderBy: { effectiveFrom: "desc" },
  });
  if (!row) {
    return null;
  }
  return {
    rate: Number(row.rate.toString()),
    source: row.source,
    effectiveFrom: row.effectiveFrom,
  };
}

export async function createFxRate(input: z.input<typeof fxSchema>) {
  const parsed = fxSchema.parse(input);
  if (parsed.baseCurrency === parsed.quoteCurrency && parsed.rate !== 1) {
    throw new Error("Для одинаковых валют курс должен быть 1.");
  }
  const row = await getPrismaClient().fxRate.create({
    data: {
      baseCurrency: parsed.baseCurrency,
      quoteCurrency: parsed.quoteCurrency,
      rate: parsed.rate,
      source: parsed.source,
      effectiveFrom: parsed.effectiveFrom,
      effectiveTo: parsed.effectiveTo ?? null,
    },
  });
  await writeAudit({
    action: "fx.create",
    entityType: "FxRate",
    entityId: row.id,
    summary: `Курс ${row.baseCurrency}→${row.quoteCurrency} = ${row.rate.toString()} (${row.source}).`,
  });
  return row;
}
