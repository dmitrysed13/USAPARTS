import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export type SourceBucket = {
  source: string;
  orders: number;
  revenueCents: number;
  leads: number;
};

export type AnalyticsKpi = {
  windowDays: number;
  orders: number;
  paidOrders: number;
  revenueCents: number;
  aovCents: number;
  leads: number;
  vinLeads: number;
  conversionOrdersPerLead: number | null;
  firstTouch: SourceBucket[];
  lastTouch: SourceBucket[];
};

function sinceDate(days: number): Date {
  const d = new Date();
  d.setUTCDate(d.getUTCDate() - days);
  return d;
}

function label(value: string | null | undefined): string {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 80) : "(none)";
}

function rollup(
  rows: Array<{ source: string | null; count: number; revenueCents?: number }>,
): SourceBucket[] {
  const map = new Map<string, SourceBucket>();
  for (const row of rows) {
    const source = label(row.source);
    const current = map.get(source) ?? {
      source,
      orders: 0,
      revenueCents: 0,
      leads: 0,
    };
    if (row.revenueCents !== undefined) {
      current.orders += row.count;
      current.revenueCents += row.revenueCents;
    } else {
      current.leads += row.count;
    }
    map.set(source, current);
  }
  return [...map.values()].sort((a, b) => b.orders + b.leads - (a.orders + a.leads));
}

/**
 * Business KPIs from orders/leads only — aggregates, no customer PII fields.
 */
export async function getAnalyticsKpis(windowDays = 30): Promise<AnalyticsKpi> {
  const days = Math.min(Math.max(Math.floor(windowDays) || 30, 1), 365);
  const since = sinceDate(days);

  return withDatabase(async () => {
    const prisma = getPrismaClient();
    const [
      orders,
      paidAgg,
      leads,
      vinLeads,
      orderFirst,
      orderLast,
      leadFirst,
      leadLast,
    ] = await Promise.all([
      prisma.order.count({ where: { createdAt: { gte: since } } }),
      prisma.order.aggregate({
        where: {
          createdAt: { gte: since },
          OR: [{ paymentState: "PAID" }, { status: "PAID" }],
        },
        _count: { _all: true },
        _sum: { totalCents: true },
      }),
      prisma.lead.count({ where: { createdAt: { gte: since } } }),
      prisma.vinRequest.count({ where: { createdAt: { gte: since } } }),
      prisma.order.groupBy({
        by: ["firstTouchSource"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        _sum: { totalCents: true },
      }),
      prisma.order.groupBy({
        by: ["lastTouchSource"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
        _sum: { totalCents: true },
      }),
      prisma.lead.groupBy({
        by: ["firstTouchSource"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
      prisma.lead.groupBy({
        by: ["lastTouchSource"],
        where: { createdAt: { gte: since } },
        _count: { _all: true },
      }),
    ]);

    const paidOrders = paidAgg._count._all;
    const revenueCents = paidAgg._sum.totalCents ?? 0;
    const aovCents = paidOrders > 0 ? Math.round(revenueCents / paidOrders) : 0;

    const mergeTouch = (
      orderRows: Array<{
        firstTouchSource?: string | null;
        lastTouchSource?: string | null;
        _count: { _all: number };
        _sum: { totalCents: number | null };
      }>,
      leadRows: Array<{
        firstTouchSource?: string | null;
        lastTouchSource?: string | null;
        _count: { _all: number };
      }>,
      key: "firstTouchSource" | "lastTouchSource",
    ) =>
      rollup([
        ...orderRows.map((row) => ({
          source: row[key] ?? null,
          count: row._count._all,
          revenueCents: row._sum.totalCents ?? 0,
        })),
        ...leadRows.map((row) => ({
          source: row[key] ?? null,
          count: row._count._all,
        })),
      ]);

    return {
      windowDays: days,
      orders,
      paidOrders,
      revenueCents,
      aovCents,
      leads,
      vinLeads,
      conversionOrdersPerLead: leads > 0 ? Number((orders / leads).toFixed(3)) : null,
      firstTouch: mergeTouch(orderFirst, leadFirst, "firstTouchSource"),
      lastTouch: mergeTouch(orderLast, leadLast, "lastTouchSource"),
    };
  });
}

export function formatMoneyCents(cents: number, currency = "BYN"): string {
  return `${(cents / 100).toFixed(2)} ${currency}`;
}
