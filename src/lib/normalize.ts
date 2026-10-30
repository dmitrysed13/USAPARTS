export function normalizeOem(value: string) {
  return value.toUpperCase().replace(/[^A-Z0-9]/g, "");
}

export function buildSearchText(parts: Array<string | null | undefined>) {
  return parts
    .filter((part): part is string => Boolean(part && part.trim()))
    .join(" ")
    .toLowerCase()
    .slice(0, 4000);
}
