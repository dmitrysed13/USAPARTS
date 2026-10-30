import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const ids = (new URL(request.url).searchParams.get("ids") ?? "")
    .split(",")
    .map((id) => id.trim())
    .filter(Boolean)
    .slice(0, 12);
  if (!ids.length) return NextResponse.json({ items: [] });
  const rows = await prisma.product.findMany({
    where: { id: { in: ids }, isPublished: true },
    select: {
      id: true,
      name: true,
      slug: true,
      sku: true,
      priceCents: true,
      currency: true,
      stockStatus: true,
      specs: { select: { name: true, value: true }, orderBy: { sortOrder: "asc" } },
    },
  });
  return NextResponse.json({ items: rows });
}
