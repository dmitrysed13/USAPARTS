import "server-only";

import { adminJson } from "@/modules/admin/respond";

const noStore = { "cache-control": "no-store" };

/**
 * Admin-ready API gate for §5. Full Better Auth / admin UI comes later.
 * Configure ADMIN_API_TOKEN (min 16 chars). Never commit the value.
 */
export function configuredAdminToken(
  source: Record<string, string | undefined> = process.env,
): string | null {
  const token = source.ADMIN_API_TOKEN?.trim();
  if (!token || token.length < 16) {
    return null;
  }
  return token;
}

function readBearer(request: Request): string | null {
  const header = request.headers.get("authorization");
  if (!header) {
    return null;
  }
  const match = /^Bearer\s+(.+)$/i.exec(header.trim());
  return match?.[1]?.trim() || null;
}

function timingSafeEqual(left: string, right: string): boolean {
  if (left.length !== right.length) {
    return false;
  }
  let diff = 0;
  for (let index = 0; index < left.length; index += 1) {
    diff |= left.charCodeAt(index) ^ right.charCodeAt(index);
  }
  return diff === 0;
}

export function requireAdminApi(
  request: Request,
): { ok: true } | { ok: false; response: Response } {
  const expected = configuredAdminToken();
  if (!expected) {
    return {
      ok: false,
      response: Response.json(
        {
          message:
            "Админ API не настроено. Задайте ADMIN_API_TOKEN длиной от 16 символов (не в репозитории).",
        },
        { status: 503, headers: noStore },
      ),
    };
  }
  const provided = readBearer(request) ?? request.headers.get("x-admin-token")?.trim() ?? "";
  if (!provided || !timingSafeEqual(provided, expected)) {
    return {
      ok: false,
      response: adminJson({ message: "Нужен токен админ API." }, 401),
    };
  }
  return { ok: true };
}
