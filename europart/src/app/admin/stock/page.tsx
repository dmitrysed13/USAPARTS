import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminStockPage() {
  await connection();
  await requireAdminSession("stock");
  const offers = await withDatabase(() =>
    getPrismaClient().productOffer.findMany({
      where: { status: "ACTIVE" },
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        quantity: true,
        availabilityStatus: true,
        stockConfirmed: true,
        sourceType: true,
        product: { select: { name: true, article: true } },
        warehouse: { select: { name: true } },
      },
    }),
  );
  return (
    <div>
      <AdminPageHeader
        description="Активные офферы / наличие. Подтверждённое наличие отдельно от quantity."
        title="Stock"
      />
      <AdminTable
        columns={["Product", "Qty", "Availability", "Confirmed", "Source", "Warehouse"]}
        emptyDescription="Офферов нет."
        emptyTitle="Stock пусто"
        rows={offers.map((offer) => [
          `${offer.product.name}${offer.product.article ? ` (${offer.product.article})` : ""}`,
          String(offer.quantity),
          offer.availabilityStatus,
          offer.stockConfirmed ? "yes" : "no",
          offer.sourceType,
          offer.warehouse?.name ?? "—",
        ])}
      />
      <AdminApiHint path="/api/admin/offers" />
    </div>
  );
}
