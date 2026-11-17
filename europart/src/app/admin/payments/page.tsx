import { connection } from "next/server";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminPaymentsPage() {
  await connection();
  await requireAdminSession("payments");
  const rows = await withDatabase(() =>
    getPrismaClient().paymentTransaction.findMany({
      orderBy: { createdAt: "desc" },
      take: 100,
      select: {
        id: true,
        provider: true,
        status: true,
        amountCents: true,
        currency: true,
        createdAt: true,
        order: { select: { number: true } },
      },
    }),
  );
  return (
    <div>
      <AdminPageHeader
        description="Платёжные транзакции. Успех только от реального провайдера — фейковых paid нет."
        title="Payments"
      />
      <AdminTable
        columns={["Order", "Provider", "Status", "Amount", "Created"]}
        emptyDescription="Транзакций нет (провайдер может быть не подключён)."
        emptyTitle="Payments пусто"
        rows={rows.map((row) => [
          row.order.number,
          row.provider,
          row.status,
          `${(row.amountCents / 100).toFixed(2)} ${row.currency}`,
          row.createdAt.toISOString().slice(0, 19),
        ])}
      />
    </div>
  );
}
