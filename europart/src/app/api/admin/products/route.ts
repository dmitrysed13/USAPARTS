import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson } from "@/modules/admin/respond";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export async function GET(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "products");
  if (!gate.ok) {
    return gate.response;
  }
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
  return adminJson({ products });
}
