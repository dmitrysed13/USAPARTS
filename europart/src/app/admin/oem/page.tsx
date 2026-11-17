import { connection } from "next/server";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminOemPage() {
  await connection();
  await requireAdminSession("oem");
  const rows = await withDatabase(() =>
    getPrismaClient().productIdentifier.findMany({
      where: { type: "OEM" },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        value: true,
        normalizedValue: true,
        isPrimary: true,
        product: { select: { name: true, slug: true } },
      },
    }),
  );
  return (
    <div>
      <AdminPageHeader
        description="OEM-номера из ProductIdentifier. Без выдуманных кроссов."
        title="OEM"
      />
      <AdminTable
        columns={["OEM", "Normalized", "Primary", "Product"]}
        emptyDescription="OEM появятся после загрузки товаров."
        emptyTitle="OEM нет"
        rows={rows.map((row) => [
          row.value,
          row.normalizedValue,
          row.isPrimary ? "yes" : "no",
          row.product.name,
        ])}
      />
    </div>
  );
}
