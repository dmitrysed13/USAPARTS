import { z } from "zod";

export const searchQuerySchema = z.object({
  q: z.string().trim().min(2).max(80),
  page: z.number().int().min(1).max(1000).default(1),
  pageSize: z.number().int().min(1).max(24).default(12),
});

export type SearchQuery = z.infer<typeof searchQuerySchema>;

export function parseSearchQuery(input: {
  q?: string | null;
  page?: string | null;
  pageSize?: string | null;
}): { ok: true; query: SearchQuery } | { ok: false; message: string } {
  const page = input.page ? Number(input.page) : 1;
  const pageSize = input.pageSize ? Number(input.pageSize) : 12;
  const parsed = searchQuerySchema.safeParse({
    q: input.q ?? "",
    page: Number.isFinite(page) ? page : -1,
    pageSize: Number.isFinite(pageSize) ? pageSize : -1,
  });
  if (!parsed.success) {
    return { ok: false, message: "Введите от 2 до 80 символов." };
  }
  return { ok: true, query: parsed.data };
}

/** Removes LIKE wildcards so a search string cannot widen the pattern. */
export function literalSearchText(value: string): string {
  return value.replace(/[%_\\]/g, "");
}
