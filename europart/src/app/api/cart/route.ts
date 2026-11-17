import { connection } from "next/server";
import { cartSetCookieHeader, mutateCart, readCartFromRequest } from "@/modules/commerce/cart-http";
import { resolveCartLines } from "@/modules/commerce/cart-service";
import { resolveCartSecret } from "@/modules/commerce/cart-cookie";

export async function GET(request: Request) {
  await connection();
  if (!resolveCartSecret()) {
    return Response.json(
      {
        message:
          "Корзина недоступна без CART_SECRET (или BETTER_AUTH_SECRET) в окружении.",
        lines: [],
        cart: { lines: [], subtotalCents: 0, currency: "BYN", issues: [] },
      },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  const lines = readCartFromRequest(request);
  const cart = await resolveCartLines(lines);
  return Response.json(
    { lines, cart },
    { status: 200, headers: { "cache-control": "no-store" } },
  );
}

export async function POST(request: Request) {
  await connection();
  try {
    const body = (await request.json()) as {
      offerId?: string;
      quantity?: number;
      clear?: boolean;
    };
    if (body.clear) {
      const setCookie = cartSetCookieHeader([]);
      if (!setCookie) {
        throw new Error("Корзина недоступна: нет CART_SECRET.");
      }
      return Response.json(
        {
          lines: [],
          cart: { lines: [], subtotalCents: 0, currency: "BYN", issues: [] },
        },
        {
          status: 200,
          headers: { "cache-control": "no-store", "set-cookie": setCookie },
        },
      );
    }
    if (!body.offerId || typeof body.offerId !== "string") {
      throw new Error("Укажите offerId.");
    }
    const quantity =
      body.quantity === undefined || body.quantity === null
        ? 1
        : Number(body.quantity);
    if (!Number.isInteger(quantity) || quantity < 0) {
      throw new Error("Количество должно быть целым числом от 0.");
    }
    const result = await mutateCart(request, {
      offerId: body.offerId,
      quantity,
    });
    return Response.json(
      { lines: result.lines, cart: result.resolved },
      {
        status: 200,
        headers: {
          "cache-control": "no-store",
          "set-cookie": result.setCookie,
        },
      },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Корзина не обновлена.";
    return Response.json(
      { message },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
}
