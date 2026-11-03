import "server-only";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";
import {
  ADMIN_COOKIE,
  configuredAdminPassword,
  isSameOrigin,
  readCookie,
  verifyAdminToken,
} from "@/lib/admin/session";
import { adminJson, adminRedirect, wantsHtml } from "@/modules/admin/respond";

const noStore = { "cache-control": "no-store" };

export async function requireAdminPage(): Promise<void> {
  await connection();
  const password = configuredAdminPassword();
  if (!password) {
    redirect("/admin/login?reason=unconfigured");
  }
  const token = (await cookies()).get(ADMIN_COOKIE)?.value;
  if (!token || !verifyAdminToken(token, password, Date.now())) {
    redirect("/admin/login");
  }
}

export function requireAdminApi(
  request: Request,
): { ok: true } | { ok: false; response: Response } {
  const password = configuredAdminPassword();
  if (!password) {
    return {
      ok: false,
      response: Response.json(
        {
          message:
            "Админ-панель не настроена. Задайте ADMIN_PASSWORD длиной от 12 символов и не храните его в репозитории.",
        },
        { status: 503, headers: noStore },
      ),
    };
  }
  if (!isSameOrigin(request)) {
    const message = "Запрос отклонён: другой сайт.";
    return {
      ok: false,
      response: wantsHtml(request)
        ? adminRedirect("/admin/login", message)
        : adminJson({ message }, 403),
    };
  }
  const token = readCookie(request.headers.get("cookie"), ADMIN_COOKIE);
  if (!token || !verifyAdminToken(token, password, Date.now())) {
    return {
      ok: false,
      response: Response.json(
        { message: "Нужен вход в админ-панель." },
        { status: 401, headers: noStore },
      ),
    };
  }
  return { ok: true };
}
