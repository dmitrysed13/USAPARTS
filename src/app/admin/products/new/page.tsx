import { ProductForm } from "@/components/admin/product-form";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function NewProductPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  await requirePermission("products.write");
  const { error } = await searchParams;
  const [categories, makes] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.vehicleMake.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  return (
    <div>
      <h1 className="mb-4 text-2xl font-semibold text-navy">Новый товар</h1>
      <ProductForm categories={categories} makes={makes} error={error} />
    </div>
  );
}
