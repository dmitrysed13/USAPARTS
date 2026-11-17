"use server";

import { revalidatePath } from "next/cache";
import { AdminAuthError, requireAdminSession } from "@/modules/admin/auth";
import { ImportService } from "@/modules/imports/service";
import type { ImportDelimiter } from "@/modules/imports/parser";

export async function uploadImportAction(
  _prev: { error: string | null; ok: boolean },
  formData: FormData,
): Promise<{ error: string | null; ok: boolean }> {
  try {
    await requireAdminSession("import");
    const file = formData.get("file");
    if (!(file instanceof File)) {
      return { error: "Выберите файл прайса.", ok: false };
    }
    const delimiterText = String(formData.get("delimiter") ?? "");
    const delimiter: ImportDelimiter =
      delimiterText === "comma" || delimiterText === "semicolon"
        ? delimiterText
        : "auto";
    const source = String(formData.get("sourceType") ?? "");
    await ImportService.upload({
      filename: file.name || "price.csv",
      bytes: new Uint8Array(await file.arrayBuffer()),
      delimiter,
      sourceType: source === "OWN_STOCK" ? "OWN_STOCK" : "SUPPLIER",
      supplierId: String(formData.get("supplierId") ?? "") || null,
      warehouseId: String(formData.get("warehouseId") ?? "") || null,
      templateId: String(formData.get("templateId") ?? "") || null,
    });
    revalidatePath("/admin/import");
    return { error: null, ok: true };
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { error: error.message, ok: false };
    }
    return {
      error: error instanceof Error ? error.message : "Файл не принят.",
      ok: false,
    };
  }
}
