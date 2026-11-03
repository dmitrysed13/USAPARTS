import { buttonClassName } from "@/components/ui/button";
import { Field, controlClassName } from "@/components/ui/field";

type Option = { id: string; name: string };

export function ProductForm({
  action,
  categories,
  brands,
  product,
}: {
  action: string;
  categories: Option[];
  brands: Option[];
  product?: {
    name: string;
    description: string | null;
    categoryId: string;
    partBrandId: string | null;
    article: string | null;
    oem: string | null;
    condition: "NEW" | "USED";
    productType: "ORIGINAL" | "ANALOG";
    status: "DRAFT" | "PUBLISHED" | "ARCHIVED";
    slug?: string;
  };
}) {
  return (
    <form action={action} className="grid gap-4" method="post">
      <Field htmlFor="product-name" label="Название">
        <input
          className={controlClassName}
          defaultValue={product?.name}
          id="product-name"
          name="name"
          required
        />
      </Field>
      {product?.slug ? (
        <p className="text-sm text-ink-muted">Адрес карточки: /product/{product.slug}</p>
      ) : null}
      <Field htmlFor="product-description" label="Описание">
        <textarea
          className={`${controlClassName} h-28 py-3`}
          defaultValue={product?.description ?? ""}
          id="product-description"
          name="description"
        />
      </Field>
      <Field htmlFor="product-category" label="Категория">
        <select
          className={controlClassName}
          defaultValue={product?.categoryId ?? ""}
          id="product-category"
          name="categoryId"
          required
        >
          <option value="">Выберите</option>
          {categories.map((category) => (
            <option key={category.id} value={category.id}>
              {category.name}
            </option>
          ))}
        </select>
      </Field>
      <Field htmlFor="product-brand" label="Бренд запчасти">
        <select
          className={controlClassName}
          defaultValue={product?.partBrandId ?? ""}
          id="product-brand"
          name="partBrandId"
        >
          <option value="">Без бренда</option>
          {brands.map((brand) => (
            <option key={brand.id} value={brand.id}>
              {brand.name}
            </option>
          ))}
        </select>
      </Field>
      <Field
        hint="Текст сохранится как есть, включая нули в начале."
        htmlFor="product-article"
        label="Артикул"
      >
        <input
          className={controlClassName}
          defaultValue={product?.article ?? ""}
          id="product-article"
          name="article"
        />
      </Field>
      <Field htmlFor="product-oem" label="OEM">
        <input
          className={controlClassName}
          defaultValue={product?.oem ?? ""}
          id="product-oem"
          name="oem"
        />
      </Field>
      <Field htmlFor="product-condition" label="Состояние">
        <select
          className={controlClassName}
          defaultValue={product?.condition ?? "NEW"}
          id="product-condition"
          name="condition"
        >
          <option value="NEW">Новая</option>
          <option value="USED">Б/у</option>
        </select>
      </Field>
      <Field htmlFor="product-type" label="Тип">
        <select
          className={controlClassName}
          defaultValue={product?.productType ?? "ANALOG"}
          id="product-type"
          name="productType"
        >
          <option value="ANALOG">Аналог</option>
          <option value="ORIGINAL">Оригинал</option>
        </select>
      </Field>
      <Field htmlFor="product-status" label="Статус">
        <select
          className={controlClassName}
          defaultValue={product?.status ?? "DRAFT"}
          id="product-status"
          name="status"
        >
          <option value="DRAFT">Черновик</option>
          <option value="PUBLISHED">Опубликован</option>
          <option value="ARCHIVED">Скрыт</option>
        </select>
      </Field>
      <button className={buttonClassName()} type="submit">
        Сохранить карточку
      </button>
    </form>
  );
}
