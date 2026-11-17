import "server-only";

import {
  CART_COOKIE,
  cartCookieOptions,
  decodeCart,
  encodeCart,
  resolveCartSecret,
  setCartQuantity,
  type CartLine,
} from "@/modules/commerce/cart-cookie";
import { resolveCartLines } from "@/modules/commerce/cart-service";

export function readCartFromRequest(request: Request): CartLine[] {
  const secret = resolveCartSecret();
  if (!secret) {
    return [];
  }
  const cookie = request.headers.get("cookie") ?? "";
  const match = cookie.match(new RegExp(`(?:^|;\\s*)${CART_COOKIE}=([^;]+)`));
  const raw = match?.[1] ? decodeURIComponent(match[1]) : undefined;
  return decodeCart(raw, secret);
}

export function cartSetCookieHeader(lines: CartLine[]): string | null {
  const secret = resolveCartSecret();
  if (!secret) {
    return null;
  }
  const value = encodeCart(lines, secret);
  const options = cartCookieOptions();
  const parts = [
    `${CART_COOKIE}=${encodeURIComponent(value)}`,
    `Path=${options.path}`,
    `Max-Age=${options.maxAge}`,
    "HttpOnly",
    `SameSite=${options.sameSite}`,
  ];
  if (options.secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

export async function mutateCart(
  request: Request,
  mutation: { offerId: string; quantity: number },
) {
  const secret = resolveCartSecret();
  if (!secret) {
    throw new Error(
      "Корзина недоступна: задайте CART_SECRET (от 16 символов) или BETTER_AUTH_SECRET.",
    );
  }
  const current = readCartFromRequest(request);
  const next = setCartQuantity(current, mutation.offerId, mutation.quantity);
  const resolved = await resolveCartLines(next);
  return { lines: next, resolved, setCookie: cartSetCookieHeader(next)! };
}
