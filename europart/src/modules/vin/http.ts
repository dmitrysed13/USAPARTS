import { clientIpFromHeaders } from "@/lib/http/client-ip";
import { vinRateLimit } from "@/lib/security/rate-limit";
import { createVinRequest, VinRequestStoreError } from "@/modules/vin/create-request";
import { vinRequestSchema } from "@/modules/vin/schema";

const noStore = { "cache-control": "no-store" };

export async function handleVinRequest(request: Request): Promise<Response> {
  const limit = vinRateLimit.consume(clientIpFromHeaders(request.headers));
  if (!limit.ok) {
    return Response.json(
      { message: "Слишком много заявок с этого адреса. Повторите позже." },
      {
        status: 429,
        headers: { ...noStore, "retry-after": String(limit.retryAfterSeconds) },
      },
    );
  }

  const raw = await request.text();
  if (raw.length > 20_000) {
    return Response.json(
      { message: "Заявка слишком большая." },
      { status: 413, headers: noStore },
    );
  }

  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    return Response.json(
      { message: "Некорректная заявка." },
      { status: 400, headers: noStore },
    );
  }

  const website =
    typeof body === "object" && body !== null && "website" in body
      ? String((body as { website?: unknown }).website ?? "")
      : "";
  if (website.trim()) {
    return Response.json(
      { message: "Заявка не принята." },
      { status: 400, headers: noStore },
    );
  }

  const parsed = vinRequestSchema.safeParse(body);
  if (!parsed.success) {
    const fieldErrors: Record<string, string[]> = {};
    for (const issue of parsed.error.issues) {
      const key = String(issue.path[0] ?? "form");
      fieldErrors[key] = [...(fieldErrors[key] ?? []), issue.message];
    }
    return Response.json(
      { message: "Проверьте поля заявки.", fieldErrors },
      { status: 400, headers: noStore },
    );
  }

  try {
    const saved = await createVinRequest(
      parsed.data,
      clientIpFromHeaders(request.headers),
    );
    return Response.json(
      {
        id: saved.id,
        status: saved.status,
        message:
          "Заявка сохранена. Менеджер свяжется с вами. Письмо и Telegram не отправляются, пока эти каналы не подключены.",
        vinNotice: saved.notice,
      },
      { status: 201, headers: noStore },
    );
  } catch (error) {
    if (error instanceof VinRequestStoreError) {
      return Response.json(
        { message: "Заявку не удалось сохранить. Повторите отправку." },
        { status: 503, headers: noStore },
      );
    }
    throw error;
  }
}
