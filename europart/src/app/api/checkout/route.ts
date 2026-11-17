import { connection } from "next/server";
import { cartSetCookieHeader, readCartFromRequest } from "@/modules/commerce/cart-http";
import { placeOrder } from "@/modules/commerce/checkout";
import { resolveCartSecret } from "@/modules/commerce/cart-cookie";
import { getPublicPaymentAvailability } from "@/modules/commerce/payment/service";
import { listActiveDeliveryMethods, quoteDeliveryMethod } from "@/modules/commerce/delivery";

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
  try {
    if (!resolveCartSecret()) {
      throw new Error("Корзина недоступна: задайте CART_SECRET.");
    }
    const body = (await request.json()) as Record<string, unknown>;
    const lines = readCartFromRequest(request);
    const order = await placeOrder({
      name: String(body.name ?? ""),
      phone: String(body.phone ?? ""),
      email: body.email ? String(body.email) : "",
      city: body.city ? String(body.city) : undefined,
      address: body.address ? String(body.address) : undefined,
      comment: body.comment ? String(body.comment) : undefined,
      deliveryMethodId: String(body.deliveryMethodId ?? ""),
      checkoutMode: body.checkoutMode === "ONLINE" ? "ONLINE" : "MANAGER",
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
