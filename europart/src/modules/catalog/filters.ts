export type CatalogSort = "name_asc" | "name_desc" | "newest";

export type CatalogFilters = {
  page: number;
  pageSize: number;
  sort: CatalogSort;
  condition?: "NEW" | "USED";
  productType?: "ORIGINAL" | "ANALOG";
  availability?:
    | "IN_STOCK"
    | "LOW_STOCK"
    | "ON_ORDER"
    | "INCOMING"
    | "OUT_OF_STOCK"
    | "DISCONTINUED"
    | "UNKNOWN";
  partBrand?: string;
  priceMin?: number;
  priceMax?: number;
  /** Category slug within a vehicle scope (server-side). */
  category?: string;
  yearFrom?: number;
  yearTo?: number;
  fuelType?: string;
};

const sorts = new Set<CatalogSort>(["name_asc", "name_desc", "newest"]);
const conditions = new Set(["NEW", "USED"]);
const kinds = new Set(["ORIGINAL", "ANALOG"]);
const availability = new Set([
  "IN_STOCK",
  "LOW_STOCK",
  "ON_ORDER",
  "INCOMING",
  "OUT_OF_STOCK",
  "DISCONTINUED",
  "UNKNOWN",
]);

function one(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed : undefined;
}

function boundedNumber(value: string | undefined, max: number): number | undefined {
  if (!value) {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > max) {
    return undefined;
  }
  return parsed;
}

export function parseCatalogFilters(
  input: Record<string, string | string[] | undefined>,
  pageSize = 12,
): CatalogFilters {
  const page = Number(one(input.page) ?? "1");
  const sort = one(input.sort);
  const condition = one(input.condition);
  const productType = one(input.productType);
  const stock = one(input.availability);
  const partBrand = one(input.partBrand);
  const category = one(input.category);
  const fuelType = one(input.fuelType);
  const yearFrom = boundedNumber(one(input.yearFrom), 2100);
  const yearTo = boundedNumber(one(input.yearTo), 2100);
  return {
    page: Number.isInteger(page) && page >= 1 && page <= 1000 ? page : 1,
    pageSize,
    sort: sort && sorts.has(sort as CatalogSort) ? (sort as CatalogSort) : "name_asc",
    condition:
      condition && conditions.has(condition)
        ? (condition as CatalogFilters["condition"])
        : undefined,
    productType:
      productType && kinds.has(productType)
        ? (productType as CatalogFilters["productType"])
        : undefined,
    availability:
      stock && availability.has(stock)
        ? (stock as CatalogFilters["availability"])
        : undefined,
    partBrand: partBrand && partBrand.length <= 80 ? partBrand : undefined,
    priceMin: boundedNumber(one(input.priceMin), 1_000_000),
    priceMax: boundedNumber(one(input.priceMax), 1_000_000),
    category: category && category.length <= 80 ? category : undefined,
    yearFrom:
      yearFrom !== undefined && yearFrom >= 1950 ? Math.floor(yearFrom) : undefined,
    yearTo: yearTo !== undefined && yearTo >= 1950 ? Math.floor(yearTo) : undefined,
    fuelType: fuelType && fuelType.length <= 40 ? fuelType : undefined,
  };
}

export function categoryAndDescendantIds(
  rows: { id: string; parentId: string | null }[],
  rootId: string,
): string[] {
  const children = new Map<string, string[]>();
  for (const row of rows) {
    if (!row.parentId) {
      continue;
    }
    const list = children.get(row.parentId) ?? [];
    list.push(row.id);
    children.set(row.parentId, list);
  }

  const ids: string[] = [];
  const seen = new Set<string>();
  const stack = [rootId];
  while (stack.length > 0) {
    const id = stack.pop();
    if (!id || seen.has(id)) {
      continue;
    }
    seen.add(id);
    ids.push(id);
    for (const child of children.get(id) ?? []) {
      stack.push(child);
    }
  }
  return ids;
}

export function catalogHref(path: string, filters: CatalogFilters, page: number): string {
  const params = new URLSearchParams();
  if (page > 1) {
    params.set("page", String(page));
  }
  if (filters.sort !== "name_asc") {
    params.set("sort", filters.sort);
  }
  if (filters.condition) {
    params.set("condition", filters.condition);
  }
  if (filters.productType) {
    params.set("productType", filters.productType);
  }
  if (filters.availability) {
    params.set("availability", filters.availability);
  }
  if (filters.partBrand) {
    params.set("partBrand", filters.partBrand);
  }
  if (filters.priceMin !== undefined) {
    params.set("priceMin", String(filters.priceMin));
  }
  if (filters.priceMax !== undefined) {
    params.set("priceMax", String(filters.priceMax));
  }
  if (filters.category) {
    params.set("category", filters.category);
  }
  if (filters.yearFrom !== undefined) {
    params.set("yearFrom", String(filters.yearFrom));
  }
  if (filters.yearTo !== undefined) {
    params.set("yearTo", String(filters.yearTo));
  }
  if (filters.fuelType) {
    params.set("fuelType", filters.fuelType);
  }
  const query = params.toString();
  return query ? `${path}?${query}` : path;
}

/** Fitment product scope for Make→…→Engine hierarchy levels. */
export type FitmentScopeInput = {
  brandId?: string;
  modelId?: string;
  generationId?: string;
  modificationId?: string;
  engineId?: string;
  yearFrom?: number;
  yearTo?: number;
  fuelType?: string;
};
