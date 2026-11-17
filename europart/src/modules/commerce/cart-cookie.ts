import { createHmac, timingSafeEqual } from "node:crypto";

export type CartLine = {
  offerId: string;
  quantity: number;
};

export const CART_COOKIE = "europart_cart";
export const MAX_CART_LINES = 40;
export const MAX_LINE_QTY = 99;

function cookieSecure(source: Record<string, string | undefined> = process.env): boolean {
  const url = source.NEXT_PUBLIC_SITE_URL ?? "";
  return url.startsWith("https://");
}

export function resolveCartSecret(
  source: Record<string, string | undefined> = process.env,
): string | null {
  const dedicated = source.CART_SECRET?.trim();
  if (dedicated && dedicated.length >= 16) {
    return dedicated;
  }
  const auth = source.BETTER_AUTH_SECRET?.trim();
  if (auth && auth.length >= 32) {
    return auth;
  }
  // Local/test only — never invent a production secret.
  if (source.NODE_ENV !== "production") {
    return "local-dev-cart-secret-not-for-production";
  }
  return null;
}

export function encodeCart(lines: CartLine[], secret: string): string {
  const normalized = normalizeLines(lines);
  const body = Buffer.from(JSON.stringify(normalized)).toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function decodeCart(raw: string | undefined, secret: string): CartLine[] {
  if (!raw) {
    return [];
  }
  const [body, mac] = raw.split(".");
  if (!body || !mac) {
    return [];
  }
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return [];
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as unknown;
    if (!Array.isArray(parsed)) {
      return [];
    }
    return normalizeLines(
      parsed
        .map((item) => {
          if (!item || typeof item !== "object") {
            return null;
          }
          const row = item as { offerId?: unknown; quantity?: unknown };
          if (typeof row.offerId !== "string" || !row.offerId) {
            return null;
          }
          const quantity = Number(row.quantity);
          if (!Number.isInteger(quantity) || quantity < 1 || quantity > MAX_LINE_QTY) {
            return null;
          }
          return { offerId: row.offerId, quantity };
        })
        .filter((item): item is CartLine => Boolean(item)),
    );
  } catch {
    return [];
  }
}

export function normalizeLines(lines: CartLine[]): CartLine[] {
  const merged = new Map<string, number>();
  for (const line of lines) {
    const prev = merged.get(line.offerId) ?? 0;
    merged.set(line.offerId, Math.min(MAX_LINE_QTY, prev + line.quantity));
  }
  return [...merged.entries()]
    .map(([offerId, quantity]) => ({ offerId, quantity }))
    .slice(0, MAX_CART_LINES);
}

export function setCartQuantity(
  lines: CartLine[],
  offerId: string,
  quantity: number,
): CartLine[] {
  if (quantity <= 0) {
    return lines.filter((line) => line.offerId !== offerId);
  }
  const next = lines.filter((line) => line.offerId !== offerId);
  next.push({ offerId, quantity: Math.min(MAX_LINE_QTY, quantity) });
  return normalizeLines(next);
}

export function cartCookieOptions(source: Record<string, string | undefined> = process.env) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(source),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  };
}
