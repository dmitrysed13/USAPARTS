import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Breadcrumbs } from "@/components/breadcrumbs";
import { JsonLd } from "@/components/json-ld";
import { Notice } from "@/components/notice";
import { ProductList } from "@/components/product-card";
import { SaveButtons } from "@/components/save-buttons";
import { addToCart } from "@/server/actions/cart";
import { submitInquiry } from "@/server/actions/store";
import { getProductBySlug, getRelated } from "@/lib/catalog";
import { canPurchase } from "@/lib/dto";
import { CONDITION_LABEL, STOCK_LABEL, schemaAvailability, schemaCondition } from "@/lib/labels";
import { formatMoney } from "@/lib/money";
import { seoFromTemplate } from "@/lib/seo";
import { absoluteUrl } from "@/lib/site";

export const revalidate = 300;

async function load(slug: string) {
  const product = await getProductBySlug(slug);
  if (!product || !product.isPublished) notFound();
  return product;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const product = await load(slug);
  const oem = product.oemNumbers.find((item) => item.isPrimary)?.number ?? product.oemNumbers[0]?.number ?? "";
  const seo = await seoFromTemplate(
    "product",
    { name: product.name, sku: product.sku, oem, condition: CONDITION_LABEL[product.condition], stock: STOCK_LABEL[product.stockStatus] },
    { title: product.seoTitle, description: product.seoDescription },
  );
  const canonical = product.canonicalPath || `/product/${product.slug}`;
  return {
    title: seo.title,
    description: seo.description,
    alternates: { canonical },
    robots: product.indexable ? { index: true, follow: true } : { index: false, follow: true },
    openGraph: { title: seo.title, description: seo.description, url: canonical, type: "website" },
  };
}

export default async function ProductPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ sent?: string; error?: string }>;
}) {
  const { slug } = await params;
  const query = await searchParams;
  const product = await load(slug);
  const related = await getRelated(product.id, product.categoryId);
  const primaryOem = product.oemNumbers.find((item) => item.isPrimary) ?? product.oemNumbers[0];
  const fitment = product.compatibilities[0];
  const purchasable = canPurchase(product);
  const crumbs = [
    { name: "Главная", href: "/" },
    { name: "Каталог", href: "/catalog" },
    ...(product.category.parent
      ? [
          { name: product.category.parent.name, href: `/catalog/${product.category.parent.slug}` },
          { name: product.category.name, href: `/catalog/${product.category.parent.slug}/${product.category.slug}` },
        ]
      : [{ name: product.category.name, href: `/catalog/${product.category.slug}` }]),
    { name: product.name },
  ];
  const offer = product.priceCents == null
    ? undefined
    : {
        "@type": "Offer",
        priceCurrency: product.currency,
        price: (product.priceCents / 100).toFixed(2),
        availability: schemaAvailability(product.stockStatus),
        url: absoluteUrl(product.canonicalPath || `/product/${product.slug}`),
        itemCondition: schemaCondition(product.condition),
      };
  const schema = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.sku,
    mpn: primaryOem?.number,
    description: product.description,
    image: product.images.map((image) => absoluteUrl(`/api/media/${image.id}`)),
    brand: product.manufacturer ? { "@type": "Brand", name: product.manufacturer } : undefined,
    offers: offer,
  };
  return (
    <div className="page py-8">
      <Breadcrumbs items={crumbs} />
      <JsonLd data={schema} />
      <div className="grid gap-8 lg:grid-cols-[1.1fr_.9fr]">
        <div>
          {product.images[0] ? (
            <img
              src={`/api/media/${product.images[0].id}`}
              alt={product.images[0].alt}
              width={product.images[0].width}
              height={product.images[0].height}
              fetchPriority="high"
              decoding="async"
              className="aspect-[4/3] w-full rounded-xl border border-line bg-white object-cover"
            />
          ) : (
            <div className="grid aspect-[4/3] place-items-center rounded-xl border border-line bg-white text-sm">Изображение не загружено</div>
          )}
          {product.images.length > 1 && (
            <ul className="mt-3 grid grid-cols-4 gap-2">
              {product.images.slice(1).map((image) => (
                <li key={image.id}>
                  <img src={`/api/media/${image.id}`} alt={image.alt} width={image.width} height={image.height} loading="lazy" decoding="async" className="aspect-square w-full rounded-md object-cover" />
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <div className="mb-3 flex flex-wrap gap-2 text-xs">
            <span className="rounded bg-mist px-2 py-1">{STOCK_LABEL[product.stockStatus]}</span>
            <span className="rounded bg-mist px-2 py-1">{CONDITION_LABEL[product.condition]}</span>
            {product.isDemo && <span className="rounded border border-amber-300 px-2 py-1 text-amber-800">Тестовая позиция</span>}
          </div>
          <h1 className="text-3xl font-semibold text-navy">{product.name}</h1>
          <p className="mt-3 text-3xl font-semibold">{formatMoney(product.priceCents, product.currency)}</p>
          {product.isDemo && product.priceCents != null && <p className="text-sm text-amber-800">Тестовая цена из базы, не оферта.</p>}
          <dl className="mt-4 grid grid-cols-2 gap-2 text-sm">
            <dt className="text-slate-500">Артикул</dt><dd>{product.sku}</dd>
            <dt className="text-slate-500">OEM</dt><dd>{product.oemNumbers.map((oem) => oem.number).join(", ") || "не указан"}</dd>
            <dt className="text-slate-500">Производитель</dt><dd>{product.manufacturer || "не указан"}</dd>
            <dt className="text-slate-500">Количество</dt><dd>{product.quantity}</dd>
            <dt className="text-slate-500">Страна происхождения</dt><dd>{product.originCountry || "не указана"}</dd>
            <dt className="text-slate-500">Гарантия</dt><dd>{product.warranty || "в карточке не указана"}</dd>
          </dl>
          <p className="mt-3 text-sm leading-6">
            {product.deliveryMinDays != null && product.deliveryMaxDays != null
              ? `Ориентир в карточке: ${product.deliveryMinDays}–${product.deliveryMaxDays} дн. ${product.isDemo ? "Это тестовое значение." : "Фактический срок подтверждает менеджер."}`
              : "Срок доставки в карточке не указан."} Служба доставки API не подставляет трек, пока перевозчик не подключён.
          </p>
          {product.donorStockNumber && <p className="mt-2 text-sm">Номер донора: {product.donorStockNumber}</p>}
          {product.donorVin && <p className="text-sm">VIN донора: {product.donorVin}. Публикуется только если внесён в карточку.</p>}
          <div className="mt-5 flex flex-wrap gap-2">
            {purchasable && (
              <form action={addToCart} className="flex gap-2">
                <input type="hidden" name="productId" value={product.id} />
                <label className="sr-only" htmlFor="qty">Количество</label>
                <input id="qty" name="quantity" type="number" min={1} max={99} defaultValue={1} className="field w-20" />
                <button className="btn-cta" type="submit">Купить</button>
              </form>
            )}
            <SaveButtons item={{ id: product.id, slug: product.slug, name: product.name, sku: product.sku }} />
          </div>
          <Notice sent={query.sent} error={query.error} />
        </div>
      </div>
      <section className="mt-10 grid gap-6 lg:grid-cols-2">
        <article className="card p-5">
          <h2 className="text-xl font-semibold text-navy">Описание</h2>
          <p className="mt-3 whitespace-pre-wrap leading-7">{product.description}</p>
        </article>
        <article className="card p-5">
          <h2 className="text-xl font-semibold text-navy">Характеристики</h2>
          <table className="mt-3 w-full text-sm">
            <tbody>
              {product.specs.map((spec) => (
                <tr key={spec.id} className="border-t border-line">
                  <th className="py-2 pr-3 text-left font-medium">{spec.name}</th>
                  <td>{spec.value}</td>
                </tr>
              ))}
              {!product.specs.length && (
                <tr><td className="py-2">Характеристики в карточке не заполнены.</td></tr>
              )}
            </tbody>
          </table>
        </article>
      </section>
      <section className="card mt-6 p-5">
        <h2 className="text-xl font-semibold text-navy">Совместимость</h2>
        <ul className="mt-3 space-y-2 text-sm">
          {product.compatibilities.map((row) => (
            <li key={row.id}>
              <Link href={`/brands/${row.make.slug}`} className="text-navy underline">{row.make.name}</Link>
              {row.model && <> · <Link href={`/brands/${row.make.slug}/${row.model.slug}`} className="text-navy underline">{row.model.name}</Link></>}
              {row.year ? ` · ${row.year}` : ""}
              {row.generation ? ` · ${row.generation.name}` : ""}
              {row.engine ? ` · ${row.engine.name}` : ""}
              {row.note ? ` · ${row.note}` : ""}
            </li>
          ))}
          {!product.compatibilities.length && <li>Совместимость не заполнена.</li>}
        </ul>
        {fitment?.model && fitment.year && (
          <p className="mt-3 text-sm">
            <Link className="text-navy underline" href={`/brands/${fitment.make.slug}/${fitment.model.slug}/${fitment.year}/${product.category.parent?.slug ?? product.category.slug}`}>
              Все позиции этой категории для {fitment.make.name} {fitment.model.name} {fitment.year}
            </Link>
          </p>
        )}
      </section>
      <section className="mt-6 grid gap-4 lg:grid-cols-3">
        <Inquiry title="Заказать из США" type="ORDER_FROM_US" productId={product.id} back={`/product/${product.slug}`} />
        <Inquiry title="Уточнить наличие" type="AVAILABILITY" productId={product.id} back={`/product/${product.slug}`} />
        <Inquiry title="Задать вопрос" type="QUESTION" productId={product.id} back={`/product/${product.slug}`} />
      </section>
      {product.inventory.length > 0 && (
        <section className="mt-6 text-sm text-slate-600">
          Склады в базе: {product.inventory.map((row) => `${row.warehouse}: ${row.quantity}`).join(", ")}.
        </section>
      )}
      {product.reviews.length > 0 && (
        <section className="mt-8">
          <h2 className="text-xl font-semibold text-navy">Отзывы к карточке</h2>
          <div className="mt-3 space-y-3">
            {product.reviews.map((review) => (
              <article key={review.id} className="card p-4 text-sm">
                <p>{review.isDemo ? "Тестовый отзыв" : "Отзыв"} · {review.authorName} · {review.rating}/5</p>
                <p className="mt-2 leading-6">{review.body}</p>
              </article>
            ))}
          </div>
        </section>
      )}
      <Related title="Похожие товары" products={related.SIMILAR} />
      <Related title="Аналоги" products={related.ANALOG} />
      <Related title="Сопутствующие товары" products={related.RELATED} />
    </div>
  );
}

function Inquiry({ title, type, productId, back }: { title: string; type: string; productId: string; back: string }) {
  return (
    <form action={submitInquiry} className="card space-y-2 p-4">
      <h2 className="font-semibold text-navy">{title}</h2>
      <input type="hidden" name="type" value={type} />
      <input type="hidden" name="productId" value={productId} />
      <input type="hidden" name="back" value={back} />
      <input name="company" className="hidden" tabIndex={-1} autoComplete="off" />
      <input name="name" required placeholder="Имя" className="field" />
      <input name="phone" required placeholder="Телефон" className="field" />
      <input name="email" type="email" placeholder="Email" className="field" />
      <textarea name="message" required minLength={3} placeholder="Сообщение" className="field min-h-20" />
      <button className="btn-navy" type="submit">{title}</button>
    </form>
  );
}

function Related({ title, products }: { title: string; products: Parameters<typeof ProductList>[0]["products"] }) {
  if (!products.length) return null;
  return (
    <section className="mt-10">
      <h2 className="mb-4 text-xl font-semibold text-navy">{title}</h2>
      <ProductList products={products} />
    </section>
  );
}
