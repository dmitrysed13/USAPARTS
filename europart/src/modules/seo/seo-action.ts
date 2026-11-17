"use server";

import { revalidatePath } from "next/cache";
import { AdminAuthError, requireAdminSession } from "@/modules/admin/auth";
import { createSemanticCluster } from "@/modules/seo/clusters";
import { SEMANTIC_CLUSTER_INTENTS } from "@/modules/seo/cluster-intents";
import { updateSeoSettings } from "@/modules/seo/settings";
import type { SemanticClusterIntent } from "@/generated/prisma/client";

export async function saveSeoSettingsAction(
  _prev: { error: string | null; ok: boolean },
  formData: FormData,
): Promise<{ error: string | null; ok: boolean }> {
  try {
    await requireAdminSession("seo");
    await updateSeoSettings({
      indexingEnabled: formData.get("indexingEnabled") === "on",
      ga4MeasurementId: String(formData.get("ga4MeasurementId") ?? ""),
      gscVerification: String(formData.get("gscVerification") ?? ""),
      yandexMetrikaId: String(formData.get("yandexMetrikaId") ?? ""),
      yandexWebmasterVerification: String(
        formData.get("yandexWebmasterVerification") ?? "",
      ),
      googleMerchantId: String(formData.get("googleMerchantId") ?? ""),
    });
    revalidatePath("/admin/seo");
    revalidatePath("/robots.txt");
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

export async function createClusterAction(
  _prev: { error: string | null; ok: boolean },
  formData: FormData,
): Promise<{ error: string | null; ok: boolean }> {
  try {
    await requireAdminSession("seo");
    const intent = String(formData.get("intent") ?? "") as SemanticClusterIntent;
    if (!SEMANTIC_CLUSTER_INTENTS.includes(intent)) {
      return { error: "Неизвестный intent.", ok: false };
    }
    const keywords = String(formData.get("keywords") ?? "")
      .split(/[\n,;]+/)
      .map((item) => item.trim())
      .filter(Boolean);
    await createSemanticCluster({
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? "") || undefined,
      intent,
      targetPath: String(formData.get("targetPath") ?? "") || null,
      notes: String(formData.get("notes") ?? "") || null,
      keywords,
    });
    revalidatePath("/admin/seo");
    return { error: null, ok: true };
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { error: error.message, ok: false };
    }
    return {
      error: error instanceof Error ? error.message : "Кластер не создан.",
      ok: false,
    };
  }
}
