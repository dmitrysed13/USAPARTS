"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { clientIpFromHeaders } from "@/lib/http/client-ip";
import { loginRateLimit } from "@/lib/security/rate-limit";
import { AdminAuthError, loginStaff } from "@/modules/admin/auth";

export async function loginAdminAction(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
  const hdrs = await headers();
  const limited = loginRateLimit.consume(clientIpFromHeaders(hdrs));
  if (!limited.ok) {
    return {
      error: `Слишком много попыток входа. Повторите через ${limited.retryAfterSeconds} с.`,
    };
  }

  const email = String(formData.get("email") ?? "");
  const password = String(formData.get("password") ?? "");
  try {
    await loginStaff(email, password);
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { error: error.message };
    }
    return { error: "Вход не выполнен." };
  }
  redirect("/admin");
}
