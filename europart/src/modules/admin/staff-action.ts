"use server";

import { revalidatePath } from "next/cache";
import {
  AdminAuthError,
  createStaffUser,
  requireAdminSession,
} from "@/modules/admin/auth";
import { isAdminRole } from "@/modules/admin/roles";

export async function createStaffAction(
  _prev: { error: string | null; ok: boolean },
  formData: FormData,
): Promise<{ error: string | null; ok: boolean }> {
  try {
    await requireAdminSession("staff");
    const role = String(formData.get("role") ?? "");
    if (!isAdminRole(role)) {
      return { error: "Неизвестная роль.", ok: false };
    }
    await createStaffUser({
      email: String(formData.get("email") ?? ""),
      name: String(formData.get("name") ?? ""),
      role,
      password: String(formData.get("password") ?? ""),
    });
    revalidatePath("/admin/staff");
    return { error: null, ok: true };
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { error: error.message, ok: false };
    }
    return {
      error: error instanceof Error ? error.message : "Сотрудник не создан.",
      ok: false,
    };
  }
}
