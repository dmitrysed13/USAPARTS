import Link from "next/link";

export function ListingFilters({
  base,
  sort,
  availability,
  condition,
}: {
  base: string;
  sort?: string;
  availability?: string;
  condition?: string;
}) {
  return (
    <form method="get" className="mb-4 flex flex-wrap items-end gap-3">
      <label className="text-sm">
        Сортировка
        <select name="sort" defaultValue={sort ?? ""} className="field mt-1">
          <option value="">Сначала новые</option>
          <option value="price_asc">Цена по возрастанию</option>
          <option value="price_desc">Цена по убыванию</option>
        </select>
      </label>
      <label className="text-sm">
        Наличие
        <select name="availability" defaultValue={availability ?? ""} className="field mt-1">
          <option value="">Все статусы</option>
          <option value="in_stock">В наличии и на складе в США, количество больше 0</option>
        </select>
      </label>
      <label className="text-sm">
        Состояние
        <select name="condition" defaultValue={condition ?? ""} className="field mt-1">
          <option value="">Любое</option>
          <option value="NEW">Новая</option>
          <option value="USED">Б/У</option>
          <option value="REFURBISHED">Восстановленная</option>
        </select>
      </label>
      <button className="btn-navy" type="submit">
        Показать
      </button>
      <Link href={base} className="text-sm text-navy underline">
        Сбросить
      </Link>
    </form>
  );
}
