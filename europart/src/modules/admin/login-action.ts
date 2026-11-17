"use server";

import { redirect } from "next/navigation";
import { AdminAuthError, loginStaff } from "@/modules/admin/auth";

export async function loginAdminAction(
  _prev: { error: string | null },
  formData: FormData,
): Promise<{ error: string | null }> {
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
