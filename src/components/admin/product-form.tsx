import { CONDITIONS, CONDITION_LABEL, STOCK_LABEL, STOCK_STATUSES } from "@/lib/labels";
import { centsToInput } from "@/lib/money";
import { saveProductAction } from "@/server/actions/admin";

type Option = { id: string; name: string; slug: string };
type Fitment = { makeSlug?: string; modelSlug?: string; year?: number | null; engineCode?: string | null };

export function ProductForm({
  product,
  categories,
  makes,
  error,
}: {
  product?: {
    id: string;
    sku: string;
    name: string;
    slug: string;
    description: string;
    manufacturer: string | null;
    warranty: string | null;
    originCountry: string | null;
    condition: string;
    stockStatus: string;
    currency: string;
    priceCents: number | null;
    quantity: number;
    deliveryMinDays: number | null;
    deliveryMaxDays: number | null;
    donorStockNumber: string | null;
    donorVin: string | null;
    allowBackorder: boolean;
    isPublished: boolean;
    isDemo: boolean;
    isFeatured: boolean;
    indexable: boolean;
    categoryId: string;
    seoTitle: string | null;
    seoDescription: string | null;
    canonicalPath: string | null;
    oemNumbers: { number: string }[];
    specs: { name: string; value: string }[];
    compatibilities: Fitment[];
  };
  categories: Option[];
  makes: Option[];
  error?: string;
}) {
  const fits = product?.compatibilities ?? [];
  return (
    <form action={saveProductAction} className="grid gap-3">
      {error && <p className="rounded bg-rose-50 px-3 py-2 text-sm text-rose-800">{error}</p>}
      {product && <input type="hidden" name="id" value={product.id} />}
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">Артикул<input name="sku" required defaultValue={product?.sku} className="field mt-1" /></label>
        <label className="text-sm">URL<input name="slug" defaultValue={product?.slug} className="field mt-1" /></label>
        <label className="text-sm md:col-span-2">Название<input name="name" required defaultValue={product?.name} className="field mt-1" /></label>
        <label className="text-sm">Категория
          <select name="categoryId" defaultValue={product?.categoryId} className="field mt-1" required>
            {categories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
          </select>
        </label>
        <label className="text-sm">Состояние
          <select name="condition" defaultValue={product?.condition ?? "NEW"} className="field mt-1">
            {CONDITIONS.map((item) => <option key={item} value={item}>{CONDITION_LABEL[item]}</option>)}
          </select>
        </label>
        <label className="text-sm">Наличие
          <select name="stockStatus" defaultValue={product?.stockStatus ?? "ON_ORDER"} className="field mt-1">
            {STOCK_STATUSES.map((item) => <option key={item} value={item}>{STOCK_LABEL[item]}</option>)}
          </select>
        </label>
        <label className="text-sm">Количество<input name="quantity" type="number" min={0} defaultValue={product?.quantity ?? 0} className="field mt-1" /></label>
        <label className="text-sm">Цена, USD<input name="price" defaultValue={centsToInput(product?.priceCents)} className="field mt-1" placeholder="пусто, если цены нет" /></label>
        <label className="text-sm">Валюта<input name="currency" defaultValue={product?.currency ?? "USD"} className="field mt-1" /></label>
        <label className="text-sm">Производитель<input name="manufacturer" defaultValue={product?.manufacturer ?? ""} className="field mt-1" /></label>
        <label className="text-sm">Страна<input name="originCountry" defaultValue={product?.originCountry ?? ""} className="field mt-1" /></label>
        <label className="text-sm">Срок от, дни<input name="deliveryMinDays" defaultValue={product?.deliveryMinDays ?? ""} className="field mt-1" /></label>
        <label className="text-sm">Срок до, дни<input name="deliveryMaxDays" defaultValue={product?.deliveryMaxDays ?? ""} className="field mt-1" /></label>
        <label className="text-sm">Гарантия<input name="warranty" defaultValue={product?.warranty ?? ""} className="field mt-1" /></label>
        <label className="text-sm">Номер донора<input name="donorStockNumber" defaultValue={product?.donorStockNumber ?? ""} className="field mt-1" /></label>
        <label className="text-sm md:col-span-2">VIN донора<input name="donorVin" defaultValue={product?.donorVin ?? ""} className="field mt-1" /></label>
      </div>
      <label className="text-sm">OEM, через запятую или с новой строки
        <textarea name="oems" className="field mt-1 min-h-16" defaultValue={product?.oemNumbers.map((oem) => oem.number).join("\n")} />
      </label>
      <label className="text-sm">Описание<textarea name="description" className="field mt-1 min-h-28" defaultValue={product?.description} /></label>
      <label className="text-sm">Характеристики, строка «название|значение»
        <textarea name="specs" className="field mt-1 min-h-20" defaultValue={product?.specs.map((spec) => `${spec.name}|${spec.value}`).join("\n")} />
      </label>
      <fieldset className="grid gap-3">
        <legend className="text-sm font-semibold">Совместимость, до трёх строк. Марка — slug.</legend>
        {[0, 1, 2].map((index) => (
          <div key={index} className="grid gap-2 md:grid-cols-4">
            <select name={`make_${index}`} defaultValue={fits[index]?.makeSlug ?? ""} className="field">
              <option value="">Марка</option>
              {makes.map((make) => <option key={make.id} value={make.slug}>{make.name}</option>)}
            </select>
            <input name={`model_${index}`} placeholder="slug модели" defaultValue={fits[index]?.modelSlug ?? ""} className="field" />
            <input name={`year_${index}`} placeholder="год" defaultValue={fits[index]?.year ?? ""} className="field" />
            <input name={`engine_${index}`} placeholder="код двигателя" defaultValue={fits[index]?.engineCode ?? ""} className="field" />
          </div>
        ))}
      </fieldset>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="text-sm">SEO title<input name="seoTitle" defaultValue={product?.seoTitle ?? ""} className="field mt-1" /></label>
        <label className="text-sm">Canonical<input name="canonicalPath" defaultValue={product?.canonicalPath ?? ""} className="field mt-1" /></label>
        <label className="text-sm md:col-span-2">SEO description<textarea name="seoDescription" defaultValue={product?.seoDescription ?? ""} className="field mt-1" /></label>
      </div>
      <div className="flex flex-wrap gap-4 text-sm">
        <label><input type="checkbox" name="allowBackorder" defaultChecked={product?.allowBackorder} /> Под заказ при нуле</label>
        <label><input type="checkbox" name="isPublished" defaultChecked={product?.isPublished ?? true} /> Опубликован</label>
        <label><input type="checkbox" name="isDemo" defaultChecked={product?.isDemo} /> Тестовые данные</label>
        <label><input type="checkbox" name="isFeatured" defaultChecked={product?.isFeatured} /> Популярный</label>
        <label><input type="checkbox" name="indexable" defaultChecked={product?.indexable ?? true} /> Индексировать</label>
      </div>
      <button className="btn-navy w-fit" type="submit">Сохранить</button>
    </form>
  );
}
