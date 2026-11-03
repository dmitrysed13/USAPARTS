import { connection } from "next/server";
import { clearedAdminCookie, requestIsSecure } from "@/lib/admin/session";
import { adminJson, wantsHtml } from "@/modules/admin/respond";

export async function POST(request: Request) {
  await connection();
  const cookie = clearedAdminCookie(requestIsSecure(request));
  if (wantsHtml(request)) {
    return new Response(null, {
      status: 303,
      headers: { location: "/admin/login", "set-cookie": cookie },
    });
  }
  const response = adminJson({ ok: true });
  response.headers.set("set-cookie", cookie);
  return response;
}
