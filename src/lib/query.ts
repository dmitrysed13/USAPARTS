import type { ListFilters } from "@/lib/catalog";

function one(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export async function readQuery(searchParams: Promise<Record<string, string | string[] | undefined>>) {
  const params = await searchParams;
  return {
    get(name: string) {
      return one(params[name]);
    },
  };
}

export function toFilters(
  params: Record<string, string | string[] | undefined>,
  fixed: Partial<ListFilters> = {},
): ListFilters {
  const page = Number(one(params.page) || 1);
  const yearFromQuery = Number(one(params.year));
  return {
    q: fixed.q ?? one(params.q),
    make: fixed.make ?? one(params.make),
    model: fixed.model ?? one(params.model),
    year: fixed.year ?? (Number.isInteger(yearFromQuery) && yearFromQuery > 1900 ? yearFromQuery : undefined),
    engine: fixed.engine ?? one(params.engine),
    category: fixed.category ?? one(params.category),
    availability: one(params.availability),
    condition: one(params.condition),
    sort: one(params.sort),
    page: Number.isInteger(page) && page > 0 ? page : 1,
  };
}
