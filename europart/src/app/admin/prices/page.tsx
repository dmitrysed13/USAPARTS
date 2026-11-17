import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminPricesPage() {
  await connection();
  await requireAdminSession("prices");
  const [offers, fx, markup] = await Promise.all([
    withDatabase(() =>
      getPrismaClient().productOffer.findMany({
        where: { status: "ACTIVE", retailPrice: { not: null } },
        orderBy: { updatedAt: "desc" },
        take: 50,
        select: {
          retailPrice: true,
          currency: true,
          product: { select: { name: true } },
        },
      }),
    ),
    withDatabase(() =>
      getPrismaClient().fxRate.findMany({ orderBy: { effectiveFrom: "desc" }, take: 10 }),
    ),
    withDatabase(() =>
      getPrismaClient().markupRule.findMany({
        where: { isActive: true },
        orderBy: { priority: "asc" },
        take: 20,
      }),
    ),
  ]);
  return (
    <div className="grid gap-10">
      <div>
        <AdminPageHeader description="Розничные цены BYN на активных офферах." title="Prices" />
        <AdminTable
          columns={["Product", "Retail", "Currency"]}
          emptyDescription="Розничных цен нет."
          emptyTitle="Prices пусто"
          rows={offers.map((offer) => [
            offer.product.name,
            offer.retailPrice?.toString() ?? "—",
            offer.currency,
          ])}
        />
      </div>
      <div>
        <h2 className="mb-3 font-display text-xl font-semibold">FX rates</h2>
        <AdminTable
          columns={["Pair", "Rate", "From"]}
          emptyDescription="Курсы не заданы."
          emptyTitle="FX пусто"
          rows={fx.map((row) => [
            `${row.baseCurrency}/${row.quoteCurrency}`,
            row.rate.toString(),
            row.effectiveFrom.toISOString().slice(0, 10),
          ])}
        />
        <AdminApiHint path="/api/admin/fx-rates" />
      </div>
      <div>
        <h2 className="mb-3 font-display text-xl font-semibold">Markup rules</h2>
        <AdminTable
          columns={["Scope", "Type", "Value", "Priority"]}
          emptyDescription="Правил наценки нет."
          emptyTitle="Markup пусто"
          rows={markup.map((row) => [
            row.scope,
            row.markupType,
            row.value.toString(),
            String(row.priority),
          ])}
        />
        <AdminApiHint path="/api/admin/markup-rules" />
      </div>
    </div>
  );
}
