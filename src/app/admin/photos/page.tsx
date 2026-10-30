import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function PhotosAdmin() {
  await requirePermission("photos.manage");
  const images = await prisma.productImage.findMany({ orderBy: { id: "desc" }, take: 60, include: { product: true } });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Фотографии</h1>
      <p className="mt-2 text-sm">Загрузка выполняется в карточке товара. Здесь последние файлы.</p>
      <ul className="mt-4 grid gap-3 sm:grid-cols-3">
        {images.map((image) => (
          <li key={image.id} className="card p-3 text-sm">
            <img src={`/api/media/${image.id}`} alt={image.alt} width={image.width} height={image.height} className="aspect-[4/3] w-full object-cover" />
            <Link className="mt-2 block text-navy underline" href={`/admin/products/${image.productId}`}>{image.product.name}</Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
