export type VinDecodeResult =
  | { status: "not_connected"; message: string }
  | { status: "ok"; make?: string; model?: string; year?: string; raw: unknown }
  | { status: "error"; message: string };

const NOT_CONNECTED =
  "Внешний VIN-декодер не подключён. Заявка сохраняется, подбор делает менеджер по описанию.";

export function vinDecoderStatus() {
  if (!process.env.VIN_DECODER_URL) return { status: "not_connected" as const, message: NOT_CONNECTED };
  return { status: "configured" as const, message: "Декодер настроен через VIN_DECODER_URL." };
}

export async function decodeVin(vin: string): Promise<VinDecodeResult> {
  const endpoint = process.env.VIN_DECODER_URL;
  if (!endpoint) return { status: "not_connected", message: NOT_CONNECTED };
  const url = `${endpoint.replace(/\/$/, "")}/${encodeURIComponent(vin)}`;
  try {
    const response = await fetch(url, {
      headers: process.env.VIN_DECODER_API_KEY
        ? { Authorization: `Bearer ${process.env.VIN_DECODER_API_KEY}` }
        : {},
      signal: AbortSignal.timeout(8000),
    });
    if (!response.ok) return { status: "error", message: `Декодер ответил ${response.status}.` };
    const raw = (await response.json()) as Record<string, unknown>;
    return {
      status: "ok",
      make: typeof raw.make === "string" ? raw.make : undefined,
      model: typeof raw.model === "string" ? raw.model : undefined,
      year: raw.year != null ? String(raw.year) : undefined,
      raw,
    };
  } catch {
    return { status: "error", message: "Декодер не ответил. Заявка всё равно будет сохранена." };
  }
}
