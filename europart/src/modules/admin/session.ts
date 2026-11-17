import { createHmac, timingSafeEqual } from "node:crypto";
import type { AdminRoleId } from "@/modules/admin/roles";
import { isAdminRole } from "@/modules/admin/roles";

export const ADMIN_SESSION_COOKIE = "europart_admin_session";

export type AdminSessionPayload = {
  userId: string;
  email: string;
  name: string;
  role: AdminRoleId;
  exp: number;
};

function cookieSecure(source: Record<string, string | undefined> = process.env): boolean {
  const url = source.NEXT_PUBLIC_SITE_URL ?? "";
  return url.startsWith("https://");
}

export function resolveAdminSessionSecret(
  source: Record<string, string | undefined> = process.env,
): string | null {
  const dedicated = source.ADMIN_SESSION_SECRET?.trim();
  if (dedicated && dedicated.length >= 16) {
    return dedicated;
  }
  const token = source.ADMIN_API_TOKEN?.trim();
  if (token && token.length >= 16) {
    return token;
  }
  const auth = source.BETTER_AUTH_SECRET?.trim();
  if (auth && auth.length >= 32) {
    return auth;
  }
  if (source.NODE_ENV !== "production") {
    return "local-dev-admin-session-secret";
  }
  return null;
}

export function encodeAdminSession(
  payload: Omit<AdminSessionPayload, "exp">,
  secret: string,
  ttlSeconds = 60 * 60 * 12,
): string {
  const body: AdminSessionPayload = {
    ...payload,
    exp: Math.floor(Date.now() / 1000) + ttlSeconds,
  };
  const raw = Buffer.from(JSON.stringify(body)).toString("base64url");
  const mac = createHmac("sha256", secret).update(raw).digest("base64url");
  return `${raw}.${mac}`;
}

export function decodeAdminSession(
  raw: string | undefined,
  secret: string,
): AdminSessionPayload | null {
  if (!raw) {
    return null;
  }
  const [body, mac] = raw.split(".");
  if (!body || !mac) {
    return null;
  }
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }
  try {
    const parsed = JSON.parse(
      Buffer.from(body, "base64url").toString("utf8"),
    ) as Partial<AdminSessionPayload>;
    if (
      typeof parsed.userId !== "string" ||
      typeof parsed.email !== "string" ||
      typeof parsed.name !== "string" ||
      typeof parsed.role !== "string" ||
      typeof parsed.exp !== "number" ||
      !isAdminRole(parsed.role)
    ) {
      return null;
    }
    if (parsed.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    return {
      userId: parsed.userId,
      email: parsed.email,
      name: parsed.name,
      role: parsed.role,
      exp: parsed.exp,
    };
  } catch {
    return null;
  }
}

export function adminSessionCookieOptions(
  source: Record<string, string | undefined> = process.env,
) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(source),
    path: "/",
    maxAge: 60 * 60 * 12,
  };
}
