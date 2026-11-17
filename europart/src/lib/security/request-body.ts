export type ReadJsonBodyResult =
  | { ok: true; value: unknown }
  | { ok: false; status: 400 | 413; message: string };

/**
 * Read request body with a hard size cap before JSON.parse.
 * Callers must not trust Content-Length alone.
 */
export async function readJsonBody(
  request: Request,
  maxBytes: number,
): Promise<ReadJsonBodyResult> {
  const raw = await request.text();
  if (raw.length > maxBytes) {
    return { ok: false, status: 413, message: "Слишком большой запрос." };
  }
  if (!raw.trim()) {
    return { ok: false, status: 400, message: "Пустое тело запроса." };
  }
  try {
    return { ok: true, value: JSON.parse(raw) as unknown };
  } catch {
    return { ok: false, status: 400, message: "Некорректный JSON." };
  }
}

export const CHECKOUT_BODY_MAX = 32_000;
export const LEAD_BODY_MAX = 20_000;
export const CART_BODY_MAX = 8_000;
export const WEBHOOK_BODY_MAX = 64_000;
