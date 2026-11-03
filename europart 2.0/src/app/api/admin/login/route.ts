import { connection } from "next/server";
import {
  ADMIN_SESSION_MS,
  adminSessionCookie,
  configuredAdminPassword,
  isSameOrigin,
  passwordsMatch,
  requestIsSecure,
  signAdminToken,
} from "@/lib/admin/session";
import { clientIpFromHeaders } from "@/lib/http/client-ip";
import { adminJson, adminRedirect, formText, wantsHtml } from "@/modules/admin/respond";
import { adminLoginRateLimit } from "@/lib/security/rate-limit";

async function readPassword(request: Request): Promise<string> {
  const type = request.headers.get("content-type") ?? "";
  if (type.includes("application/json")) {
    const body = (await request.json().catch(() => null)) as {
      password?: unknown;
    } | null;
    return typeof body?.password === "string" ? body.password : "";
  }
  const form = await request.formData();
  return formText(form, "password");
}

export async function handleAdminLogin(request: Request): Promise<Response> {
  const html = wantsHtml(request);
  const configured = configuredAdminPassword();
  if (!configured) {
    const message =
      "Админ-панель не настроена. Задайте ADMIN_PASSWORD длиной от 12 символов и не храните его в репозитории.";
    return html ? adminRedirect("/admin/login", message) : adminJson({ message }, 503);
  }
  if (!isSameOrigin(request)) {
    const message = "Запрос отклонён: другой сайт.";
    return html ? adminRedirect("/admin/login", message) : adminJson({ message }, 403);
  }
  const limit = adminLoginRateLimit.consume(clientIpFromHeaders(request.headers));
  if (!limit.ok) {
    return adminJson({ message: "Слишком много попыток входа. Повторите позже." }, 429);
  }
  const password = await readPassword(request);
  if (!passwordsMatch(password, configured)) {
    return html
      ? adminRedirect("/admin/login", "Неверный пароль.")
      : adminJson({ message: "Неверный пароль." }, 401);
  }
  const cookie = adminSessionCookie(
    signAdminToken(configured, Date.now() + ADMIN_SESSION_MS),
    requestIsSecure(request),
  );
  if (html) {
    return new Response(null, {
      status: 303,
      headers: { location: "/admin", "set-cookie": cookie },
    });
  }
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: {
      "content-type": "application/json",
      "cache-control": "no-store",
      "set-cookie": cookie,
    },
  });
}

export async function POST(request: Request) {
  await connection();
  return handleAdminLogin(request);
}
