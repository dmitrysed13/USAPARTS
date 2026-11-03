import { createHash, createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_COOKIE = "europart_admin";
export const ADMIN_SESSION_MS = 12 * 60 * 60 * 1000;

export function configuredAdminPassword(
  source: NodeJS.ProcessEnv = process.env,
): string | null {
  const value = source.ADMIN_PASSWORD?.trim();
  if (!value || value.length < 12) {
    return null;
  }
  return value;
}

export function passwordsMatch(input: string, expected: string): boolean {
  const left = createHash("sha256").update(input).digest();
  const right = createHash("sha256").update(expected).digest();
  return timingSafeEqual(left, right);
}

export function signAdminToken(password: string, expiresAt: number): string {
  const payload = String(expiresAt);
  const signature = createHmac("sha256", password).update(payload).digest("hex");
  return `${payload}.${signature}`;
}

export function verifyAdminToken(token: string, password: string, now: number): boolean {
  const parts = token.split(".");
  if (parts.length !== 2) {
    return false;
  }
  const [payload, signature] = parts;
  if (
    !payload ||
    !signature ||
    !/^\d+$/.test(payload) ||
    !/^[a-f0-9]{64}$/.test(signature)
  ) {
    return false;
  }
  const expected = createHmac("sha256", password).update(payload).digest("hex");
  const left = Buffer.from(signature);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return false;
  }
  return Number(payload) > now;
}

export function adminSessionCookie(token: string, secure: boolean): string {
  const maxAge = Math.floor(ADMIN_SESSION_MS / 1000);
  return [
    `${ADMIN_COOKIE}=${token}`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    `Max-Age=${maxAge}`,
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function clearedAdminCookie(secure: boolean): string {
  return [
    `${ADMIN_COOKIE}=`,
    "HttpOnly",
    "Path=/",
    "SameSite=Lax",
    "Max-Age=0",
    secure ? "Secure" : "",
  ]
    .filter(Boolean)
    .join("; ");
}

export function readCookie(header: string | null, name: string): string | null {
  if (!header) {
    return null;
  }
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return null;
}

export function requestIsSecure(request: Request): boolean {
  return new URL(request.url).protocol === "https:";
}

export function isSameOrigin(request: Request): boolean {
  const origin = request.headers.get("origin");
  if (!origin) {
    return true;
  }
  let originHost = "";
  try {
    originHost = new URL(origin).host;
  } catch {
    return false;
  }
  const forwarded = request.headers.get("host");
  if (forwarded && originHost === forwarded) {
    return true;
  }
  try {
    return originHost === new URL(request.url).host;
  } catch {
    return false;
  }
}
