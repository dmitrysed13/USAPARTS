import "server-only";

import { cookies } from "next/headers";
import { adminJson } from "@/modules/admin/respond";
import type { AdminPermission } from "@/modules/admin/roles";
import { roleHasPermission } from "@/modules/admin/roles";
import {
  ADMIN_SESSION_COOKIE,
  decodeAdminSession,
  resolveAdminSessionSecret,
  type AdminSessionPayload,
} from "@/modules/admin/session";

const noStore = { "cache-control": "no-store" };

/**
 * Admin API gate: Bearer/x-admin-token OR signed staff session cookie.
 * Configure ADMIN_API_TOKEN and/or staff users. Never commit secrets.
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

export type AdminGate =
  | { ok: true; via: "token" | "session"; session?: AdminSessionPayload }
  | { ok: false; response: Response };

export function requireAdminApi(
  request: Request,
  permission?: AdminPermission,
): AdminGate {
  const expected = configuredAdminToken();
  const provided = readBearer(request) ?? request.headers.get("x-admin-token")?.trim() ?? "";
  if (expected && provided && timingSafeEqual(provided, expected)) {
    // Token auth is treated as SUPER_ADMIN for API automation.
    if (permission && !roleHasPermission("SUPER_ADMIN", permission)) {
      return {
        ok: false,
        response: adminJson({ message: "Недостаточно прав." }, 403),
      };
    }
    return { ok: true, via: "token" };
  }

  // Session cookie is checked asynchronously by requireAdminApiAsync for pages/API.
  void permission;
  if (!expected) {
    return {
      ok: false,
      response: Response.json(
        {
          message:
            "Админ API не настроено. Задайте ADMIN_API_TOKEN (от 16 символов) или войдите сессией сотрудника.",
        },
        { status: 503, headers: noStore },
      ),
    };
  }
  return {
    ok: false,
    response: adminJson({ message: "Нужен токен админ API или сессия сотрудника." }, 401),
  };
}

/** Prefer this for App Router handlers — accepts token or staff session. */
export async function requireAdminApiAsync(
  request: Request,
  permission?: AdminPermission,
): Promise<AdminGate> {
  const tokenGate = (() => {
    const expected = configuredAdminToken();
    const provided =
      readBearer(request) ?? request.headers.get("x-admin-token")?.trim() ?? "";
    if (expected && provided && timingSafeEqual(provided, expected)) {
      return { ok: true as const, via: "token" as const };
    }
    return null;
  })();
  if (tokenGate) {
    if (permission && !roleHasPermission("SUPER_ADMIN", permission)) {
      return {
        ok: false,
        response: adminJson({ message: "Недостаточно прав." }, 403),
      };
    }
    return tokenGate;
  }

  const secret = resolveAdminSessionSecret();
  if (!secret) {
    return {
      ok: false,
      response: Response.json(
        {
          message:
            "Админ API не настроено. Задайте ADMIN_API_TOKEN / ADMIN_SESSION_SECRET или создайте сотрудника.",
        },
        { status: 503, headers: noStore },
      ),
    };
  }
  const jar = await cookies();
  const session = decodeAdminSession(jar.get(ADMIN_SESSION_COOKIE)?.value, secret);
  if (!session) {
    return {
      ok: false,
      response: adminJson({ message: "Нужен токен админ API или сессия сотрудника." }, 401),
    };
  }
  if (permission && !roleHasPermission(session.role, permission)) {
    return {
      ok: false,
      response: adminJson({ message: "Недостаточно прав для этого раздела." }, 403),
    };
  }
  return { ok: true, via: "session", session };
}
