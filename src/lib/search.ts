import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/db";
import { logError } from "@/lib/logger";
import { normalizeOem } from "@/lib/normalize";

export async function searchProductIds(query: string) {
  const q = query.trim().slice(0, 80);
  if (q.length < 2) return [];
  const oem = normalizeOem(q);
  try {
    const rows = await prisma.$queryRaw<{ id: string }[]>(Prisma.sql`
      SELECT p.id
      FROM "Product" p
      LEFT JOIN "OemNumber" o ON o."productId" = p.id
      WHERE p."isPublished" = true
        AND (
          p.sku ILIKE ${q}
          OR p."searchText" ILIKE ${"%" + q + "%"}
          OR (${oem} <> '' AND o.normalized = ${oem})
          OR similarity(p."searchText", ${q}) > 0.18
        )
      GROUP BY p.id
      ORDER BY MAX(
        GREATEST(
          similarity(p."searchText", ${q}),
          similarity(p.sku, ${q}),
          CASE WHEN o.normalized = ${oem} AND ${oem} <> '' THEN 1 ELSE 0 END
        )
      ) DESC
      LIMIT 400
    `);
    return rows.map((row) => row.id);
  } catch (error) {
    logError("search.trgm", error);
    const rows = await prisma.product.findMany({
      where: {
        isPublished: true,
        OR: [
          { name: { contains: q, mode: "insensitive" } },
          { sku: { contains: q, mode: "insensitive" } },
          { searchText: { contains: q.toLowerCase() } },
          ...(oem ? [{ oemNumbers: { some: { normalized: { contains: oem } } } }] : []),
        ],
      },
      select: { id: true },
      take: 400,
    });
    return rows.map((row) => row.id);
  }
}

export async function suggestProducts(query: string) {
  const ids = await searchProductIds(query);
  if (!ids.length) return [];
  const rows = await prisma.product.findMany({
    where: { id: { in: ids.slice(0, 8) } },
    select: { id: true, name: true, slug: true, sku: true, oemNumbers: { where: { isPrimary: true }, take: 1 } },
  });
  const order = new Map(ids.map((id, index) => [id, index]));
  return rows
    .sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0))
    .map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      sku: row.sku,
      oem: row.oemNumbers[0]?.number ?? null,
      fuzzy: !row.name.toLowerCase().includes(query.trim().toLowerCase()) && row.sku.toLowerCase() !== query.trim().toLowerCase(),
    }));
}
