import { stringify } from "csv-stringify/sync";
import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";

export const dynamic = "force-dynamic";

export async function GET() {
  const session = await auth();
  if (!session?.user || !can(session.user.role, "import.run")) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  const products = await prisma.product.findMany({
    include: {
      category: true,
      oemNumbers: { where: { isPrimary: true }, take: 1 },
      compatibilities: { include: { make: true, model: true }, take: 1 },
    },
    orderBy: { sku: "asc" },
  });
  const csv = stringify(
    products.map((product) => ({
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      price: product.priceCents == null ? "" : (product.priceCents / 100).toFixed(2),
      currency: product.currency,
      quantity: product.quantity,
      condition: product.condition,
      stockStatus: product.stockStatus,
      categorySlug: product.category.slug,
      oem: product.oemNumbers[0]?.number ?? "",
      manufacturer: product.manufacturer ?? "",
      description: product.description,
      makeSlug: product.compatibilities[0]?.make.slug ?? "",
      modelSlug: product.compatibilities[0]?.model?.slug ?? "",
      year: product.compatibilities[0]?.year ?? "",
      isPublished: product.isPublished,
      isDemo: product.isDemo,
    })),
    { header: true },
  );
  return new NextResponse(csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": "attachment; filename=usaparts-products.csv",
    },
  });
}
