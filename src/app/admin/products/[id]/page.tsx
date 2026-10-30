import { notFound } from "next/navigation";
import { ProductForm } from "@/components/admin/product-form";
import { deleteProductImageAction, uploadProductImageAction } from "@/server/actions/admin";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; saved?: string }> }) {
  await requirePermission("products.write");
  const { id } = await params;
  const query = await searchParams;
  const product = await prisma.product.findUnique({
    where: { id },
    include: {
      oemNumbers: true,
      specs: { orderBy: { sortOrder: "asc" } },
      images: { orderBy: { sortOrder: "asc" } },
      compatibilities: { include: { make: true, model: true, engine: true } },
    },
  });
  if (!product) notFound();
  const [categories, makes] = await Promise.all([
    prisma.category.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
    prisma.vehicleMake.findMany({ orderBy: { name: "asc" }, select: { id: true, name: true, slug: true } }),
  ]);
  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-semibold text-navy">{product.name}</h1>
      {query.saved && <p className="text-sm text-ok">Сохранено.</p>}
      <ProductForm
        categories={categories}
        makes={makes}
        error={query.error}
        product={{
          ...product,
          compatibilities: product.compatibilities.map((row) => ({
            makeSlug: row.make.slug,
            modelSlug: row.model?.slug,
            year: row.year,
            engineCode: row.engine?.code,
          })),
        }}
      />
      <section>
        <h2 className="font-semibold text-navy">Фотографии</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {product.images.map((image) => (
            <li key={image.id} className="flex items-center gap-3">
              <img src={`/api/media/${image.id}`} alt={image.alt} width={80} height={60} className="h-14 w-20 object-cover" />
              <span>{image.alt}</span>
              <form action={deleteProductImageAction}>
                <input type="hidden" name="id" value={image.id} />
                <button className="text-rose-700" type="submit">Удалить</button>
              </form>
            </li>
          ))}
        </ul>
        <form action={uploadProductImageAction} className="mt-3 flex flex-wrap items-end gap-2">
          <input type="hidden" name="productId" value={product.id} />
          <label className="text-sm">Файл<input name="file" type="file" accept="image/jpeg,image/png,image/webp" required className="block" /></label>
          <label className="text-sm">Alt<input name="alt" className="field" /></label>
          <button className="btn-ghost" type="submit">Загрузить</button>
        </form>
      </section>
    </div>
  );
}
