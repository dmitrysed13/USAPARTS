import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

export type CartLine = { productId: string; quantity: number };

const COOKIE = "usaparts_cart";

function secret() {
  const value = process.env.AUTH_SECRET;
  if (!value) throw new Error("AUTH_SECRET is not set");
  return value;
}

function cookieSecure() {
  const url = process.env.AUTH_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
  return url.startsWith("https://");
}

export function encodeCart(lines: CartLine[], key = secret()) {
  const body = Buffer.from(JSON.stringify(lines)).toString("base64url");
  const mac = createHmac("sha256", key).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function decodeCart(raw: string | undefined, key = secret()): CartLine[] {
  if (!raw) return [];
  const [body, mac] = raw.split(".");
  if (!body || !mac) return [];
  const expected = createHmac("sha256", key).update(body).digest("base64url");
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) return [];
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => {
        if (!item || typeof item !== "object") return null;
        const row = item as { productId?: unknown; quantity?: unknown };
        if (typeof row.productId !== "string" || !row.productId) return null;
        const quantity = Number(row.quantity);
        if (!Number.isInteger(quantity) || quantity < 1 || quantity > 99) return null;
        return { productId: row.productId, quantity };
      })
      .filter((item): item is CartLine => Boolean(item))
      .slice(0, 50);
  } catch {
    return [];
  }
}

export async function readCart() {
  const jar = await cookies();
  return decodeCart(jar.get(COOKIE)?.value);
}

export async function writeCart(lines: CartLine[]) {
  const jar = await cookies();
  jar.set(COOKIE, encodeCart(lines), {
    httpOnly: true,
    sameSite: "lax",
    secure: cookieSecure(),
    path: "/",
    maxAge: 60 * 60 * 24 * 30,
  });
}
