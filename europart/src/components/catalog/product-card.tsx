import Link from "next/link";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/state";
import {
  publicAvailabilityLabels,
  type PublicProduct,
} from "@/modules/catalog/public-dto";

function money(amount: string, currency: string): string {
  const formatted = new Intl.NumberFormat("ru-BY", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(Number(amount));
  return `${formatted} ${currency}`;
}

export function ProductCard({ product }: { product: PublicProduct }) {
  const priceParams = new URLSearchParams({ partName: product.name });
  if (product.article) {
    priceParams.set("partNumber", product.article);
  }
  const image = product.images[0];

  return (
    <Card className="flex h-full flex-col overflow-hidden">
      <Link className="block" href={`/product/${product.slug}`}>
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            alt={image.alt}
            className="aspect-[4/3] w-full bg-surface-muted object-contain"
            src={image.url}
          />
        ) : (
          <div className="flex aspect-[4/3] items-center justify-center bg-surface-muted px-4 text-center text-sm text-ink-muted">
            Фото не загружено
          </div>
        )}
      </Link>
      <div className="flex flex-1 flex-col gap-3 p-4">
        <div>
          <Link
            className="break-words font-display text-lg font-semibold leading-6 hover:text-brand"
            href={`/product/${product.slug}`}
          >
            {product.name}
          </Link>
          {product.partBrand ? (
            <p className="mt-1 text-sm text-ink-muted">{product.partBrand.name}</p>
          ) : null}
          {product.article ? (
            <p className="mt-2 break-all text-sm">Артикул {product.article}</p>
          ) : null}
        </div>
        <p className="text-sm text-ink-muted">
          {publicAvailabilityLabels[product.availability]}
        </p>
        <div className="mt-auto">
          {product.price ? (
            <p className="font-semibold">
              {money(product.price.amount, product.price.currency)}
            </p>
          ) : (
            <Link
              className="text-sm font-semibold text-brand hover:text-brand-strong"
              href={`/vin-search?${priceParams.toString()}`}
            >
              Уточнить цену
            </Link>
          )}
        </div>
      </div>
    </Card>
  );
}

export function ProductGrid({
  items,
  emptyTitle,
  emptyDescription,
}: {
  items: PublicProduct[];
  emptyTitle: string;
  emptyDescription: string;
}) {
  if (items.length === 0) {
    return <EmptyState description={emptyDescription} title={emptyTitle} />;
  }
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {items.map((product) => (
        <ProductCard key={product.id} product={product} />
      ))}
    </div>
  );
}
