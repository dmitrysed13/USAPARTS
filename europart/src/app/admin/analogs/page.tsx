import { connection } from "next/server";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminAnalogsPage() {
  await connection();
  await requireAdminSession("analogs");
  const rows = await withDatabase(() =>
    getPrismaClient().productIdentifier.findMany({
      where: { type: { in: ["ANALOG", "CROSS_REFERENCE"] } },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        type: true,
        value: true,
        product: { select: { name: true, article: true } },
      },
    }),
  );
  return (
    <div>
      <AdminPageHeader
        description="Аналоги и кросс-номера из идентификаторов товара."
        title="Analogs"
      />
      <AdminTable
        columns={["Type", "Value", "Product", "Article"]}
        emptyDescription="Аналоги появятся после импорта/ручного ввода."
        emptyTitle="Аналогов нет"
        rows={rows.map((row) => [
          row.type,
          row.value,
          row.product.name,
          row.product.article ?? "—",
        ])}
      />
    </div>
  );
}
