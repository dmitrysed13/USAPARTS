"use server";

import { revalidatePath } from "next/cache";
import { AdminAuthError, requireAdminSession } from "@/modules/admin/auth";
import { createRedirectRule } from "@/modules/admin/redirects";

export async function createRedirectAction(
  _prev: { error: string | null; ok: boolean },
  formData: FormData,
): Promise<{ error: string | null; ok: boolean }> {
  try {
    await requireAdminSession("redirects");
    await createRedirectRule({
      fromPath: String(formData.get("fromPath") ?? ""),
      toPath: String(formData.get("toPath") ?? ""),
      note: String(formData.get("note") ?? ""),
      isActive: formData.get("isActive") !== "off",
    });
    revalidatePath("/admin/redirects");
    return { error: null, ok: true };
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { error: error.message, ok: false };
    }
    return {
      error: error instanceof Error ? error.message : "Редирект не создан.",
      ok: false,
    };
  }
}
