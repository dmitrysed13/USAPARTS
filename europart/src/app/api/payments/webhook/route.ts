import { connection } from "next/server";
import { clientIpFromHeaders } from "@/lib/http/client-ip";
import { WEBHOOK_BODY_MAX } from "@/lib/security/request-body";
import { rateLimitResponse, webhookRateLimit } from "@/lib/security/rate-limit";
import { handlePaymentWebhook } from "@/modules/commerce/payment/service";

export async function POST(request: Request) {
  await connection();
  const limited = webhookRateLimit.consume(clientIpFromHeaders(request.headers));
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSeconds);
  }

  const rawBody = await request.text();
  if (rawBody.length > WEBHOOK_BODY_MAX) {
    return Response.json(
      { ok: false, message: "Слишком большой вебхук." },
      { status: 413, headers: { "cache-control": "no-store" } },
    );
  }

  const result = await handlePaymentWebhook({
    rawBody,
    headers: request.headers,
  });
  return Response.json(
    { ok: result.ok, message: result.message, duplicate: result.duplicate ?? false },
    {
      status: result.ok ? 200 : 400,
      headers: { "cache-control": "no-store" },
    },
  );
}
