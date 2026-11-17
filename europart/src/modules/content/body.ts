/** Split editorial body into paragraphs. Escaping happens at render time. */
export function splitContentParagraphs(body: string): string[] {
  return body
    .replace(/\r\n/g, "\n")
    .split(/\n{2,}/)
    .map((part) => part.trim())
    .filter(Boolean);
}

/** Quality gate: non-empty unique body (no whitespace-only spam). */
export function hasUsefulBody(body: string | null | undefined): boolean {
  return Boolean(body?.trim() && body.trim().length >= 20);
}
