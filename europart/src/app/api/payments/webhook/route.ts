import { connection } from "next/server";
import { handlePaymentWebhook } from "@/modules/commerce/payment/service";

export async function POST(request: Request) {
  await connection();
  const rawBody = await request.text();
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
