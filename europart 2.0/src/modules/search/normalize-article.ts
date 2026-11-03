const ARTICLE_SEPARATORS = /[\s\u00A0./\\_-]+/g;

/**
 * Makes article and OEM lookups stable.
 * Spaces, hyphens, dots and slashes are removed. Letter case is ignored.
 * This does not correct unknown typos and does not invent cross-references.
 */
export function normalizeArticle(value: string): string {
  return value.normalize("NFKC").toUpperCase().replace(ARTICLE_SEPARATORS, "");
}
