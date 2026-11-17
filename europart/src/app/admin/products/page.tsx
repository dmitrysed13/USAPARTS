import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export default async function AdminProductsPage() {
  await connection();
  await requireAdminSession("products");
  const products = await withDatabase(() =>
    getPrismaClient().product.findMany({
      orderBy: { updatedAt: "desc" },
      take: 100,
      select: {
        id: true,
        name: true,
        slug: true,
        status: true,
        article: true,
        oem: true,
        mpn: true,
        category: { select: { name: true } },
        partBrand: { select: { name: true } },
        _count: { select: { offers: true } },
      },
    }),
  );
  return (
    <div>
      <AdminPageHeader
        description="Список из базы. Создание/редактирование — через импорт и API; фейковые товары не добавляются."
        title="Products"
      />
      <AdminTable
        columns={["Название", "Статус", "Артикул/OEM/MPN", "Категория", "Бренд", "Офферы"]}
        emptyDescription="Опубликованных и черновых товаров пока нет."
        emptyTitle="Товаров нет"
        rows={products.map((product) => [
          <div key="n">
            <p className="font-medium">{product.name}</p>
            <p className="text-xs text-ink-muted">{product.slug}</p>
          </div>,
          product.status,
          [product.article, product.oem, product.mpn].filter(Boolean).join(" · ") || "—",
          product.category.name,
          product.partBrand?.name ?? "—",
          String(product._count.offers),
        ])}
      />
      <AdminApiHint path="/api/admin/products" />
    </div>
  );
}
