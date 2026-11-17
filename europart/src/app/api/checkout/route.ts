import { connection } from "next/server";
import { ATTR_FIRST_COOKIE, ATTR_LAST_COOKIE } from "@/modules/analytics/attribution";
import { clientIpFromHeaders } from "@/lib/http/client-ip";
import {
  CHECKOUT_BODY_MAX,
  readJsonBody,
} from "@/lib/security/request-body";
import {
  checkoutRateLimit,
  rateLimitResponse,
} from "@/lib/security/rate-limit";
import { cartSetCookieHeader, readCartFromRequest } from "@/modules/commerce/cart-http";
import { placeOrder } from "@/modules/commerce/checkout";
import { resolveCartSecret } from "@/modules/commerce/cart-cookie";
import { getPublicPaymentAvailability } from "@/modules/commerce/payment/service";
import { listActiveDeliveryMethods, quoteDeliveryMethod } from "@/modules/commerce/delivery";

function cookieValue(request: Request, name: string): string | null {
  const header = request.headers.get("cookie") ?? "";
  const match = header.split(/;\s*/).find((part) => part.startsWith(`${name}=`));
  if (!match) {
    return null;
  }
  try {
    return decodeURIComponent(match.slice(name.length + 1));
  } catch {
    return match.slice(name.length + 1);
  }
}

export async function GET() {
  await connection();
  const methods = await listActiveDeliveryMethods();
  const payment = await getPublicPaymentAvailability();
  return Response.json(
    {
      deliveryMethods: methods.map((method) => ({
        ...quoteDeliveryMethod(method),
        description: method.description,
      })),
      payment,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  await connection();
  const limited = checkoutRateLimit.consume(clientIpFromHeaders(request.headers));
  if (!limited.ok) {
    return rateLimitResponse(limited.retryAfterSeconds);
  }
  try {
    if (!resolveCartSecret()) {
      throw new Error("Корзина недоступна: задайте CART_SECRET.");
    }
    const parsed = await readJsonBody(request, CHECKOUT_BODY_MAX);
    if (!parsed.ok) {
      return Response.json(
        { message: parsed.message },
        { status: parsed.status, headers: { "cache-control": "no-store" } },
      );
    }
    const body =
      parsed.value && typeof parsed.value === "object"
        ? (parsed.value as Record<string, unknown>)
        : {};
    const lines = readCartFromRequest(request);
    const attribution =
      body.attribution && typeof body.attribution === "object"
        ? (body.attribution as Record<string, unknown>)
        : undefined;
    const order = await placeOrder({
      name: String(body.name ?? ""),
      phone: String(body.phone ?? ""),
      email: body.email ? String(body.email) : "",
      city: body.city ? String(body.city) : undefined,
      address: body.address ? String(body.address) : undefined,
      comment: body.comment ? String(body.comment) : undefined,
      deliveryMethodId: String(body.deliveryMethodId ?? ""),
      checkoutMode: body.checkoutMode === "ONLINE" ? "ONLINE" : "MANAGER",
      attribution: attribution
        ? {
            utmSource: attribution.utmSource ? String(attribution.utmSource) : null,
            utmMedium: attribution.utmMedium ? String(attribution.utmMedium) : null,
            utmCampaign: attribution.utmCampaign
              ? String(attribution.utmCampaign)
              : null,
            utmContent: attribution.utmContent ? String(attribution.utmContent) : null,
            utmTerm: attribution.utmTerm ? String(attribution.utmTerm) : null,
            firstTouchSource: attribution.firstTouchSource
              ? String(attribution.firstTouchSource)
              : null,
            lastTouchSource: attribution.lastTouchSource
              ? String(attribution.lastTouchSource)
              : null,
          }
        : undefined,
      attributionCookies: {
        first: cookieValue(request, ATTR_FIRST_COOKIE),
        last: cookieValue(request, ATTR_LAST_COOKIE),
      },
      lines,
    });
    const clearCookie = cartSetCookieHeader([])!;
    return Response.json(order, {
      status: 201,
      headers: { "cache-control": "no-store", "set-cookie": clearCookie },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Заказ не создан.";
    return Response.json(
      { message },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
}
