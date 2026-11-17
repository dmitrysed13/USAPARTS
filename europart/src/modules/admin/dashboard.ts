import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export async function getAdminDashboardCounts() {
  return withDatabase(async () => {
    const prisma = getPrismaClient();
    const [
      products,
      publishedProducts,
      categories,
      brands,
      orders,
      vinRequests,
      suppliers,
      warehouses,
      offers,
      leads,
      imports,
    ] = await Promise.all([
      prisma.product.count(),
      prisma.product.count({ where: { status: "PUBLISHED" } }),
      prisma.category.count(),
      prisma.vehicleBrand.count(),
      prisma.order.count(),
      prisma.vinRequest.count({ where: { status: "NEW" } }),
      prisma.supplier.count(),
      prisma.warehouse.count(),
      prisma.productOffer.count({ where: { status: "ACTIVE" } }),
      prisma.lead.count(),
      prisma.importJob.count(),
    ]);
    return {
      products,
      publishedProducts,
      categories,
      brands,
      orders,
      vinRequests,
      suppliers,
      warehouses,
      offers,
      leads,
      imports,
    };
  });
}
