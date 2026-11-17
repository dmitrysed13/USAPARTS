"use server";

import { revalidatePath } from "next/cache";
import { AdminAuthError, requireAdminSession } from "@/modules/admin/auth";
import { updateCompanySettings } from "@/modules/admin/company-settings";

export async function saveCompanySettingsAction(
  _prev: { error: string | null; ok: boolean },
  formData: FormData,
): Promise<{ error: string | null; ok: boolean }> {
  try {
    await requireAdminSession("company");
    await updateCompanySettings({
      orgName: String(formData.get("orgName") ?? ""),
      legalName: String(formData.get("legalName") ?? ""),
      unp: String(formData.get("unp") ?? ""),
      legalAddress: String(formData.get("legalAddress") ?? ""),
      actualAddress: String(formData.get("actualAddress") ?? ""),
      phones: String(formData.get("phones") ?? ""),
      email: String(formData.get("email") ?? ""),
      hours: String(formData.get("hours") ?? ""),
      publishToStorefront: formData.get("publishToStorefront") === "on",
    });
    revalidatePath("/admin/company");
    revalidatePath("/");
    return { error: null, ok: true };
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { error: error.message, ok: false };
    }
    return {
      error: error instanceof Error ? error.message : "Не сохранено.",
      ok: false,
    };
  }
}
