import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";
import { envIndexingFlag } from "@/modules/seo/policy";

export type SeoAnalyticsIds = {
  indexingEnabled: boolean;
  envIndexingEnabled: boolean;
  ga4MeasurementId: string | null;
  gscVerification: string | null;
  yandexMetrikaId: string | null;
  yandexWebmasterVerification: string | null;
  googleMerchantId: string | null;
};

function cleanId(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, 120) : null;
}

function envOrDb(
  envKey: string,
  dbValue: string | null | undefined,
  source: Record<string, string | undefined> = process.env,
): string | null {
  return cleanId(source[envKey]) ?? cleanId(dbValue);
}

export async function getSeoSettingsRow() {
  return withDatabase(async () => {
    const prisma = getPrismaClient();
    const existing = await prisma.seoSettings.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (existing) {
      return existing;
    }
    return prisma.seoSettings.create({ data: { indexingEnabled: false } });
  });
}

export async function getSeoAnalyticsIds(
  source: Record<string, string | undefined> = process.env,
): Promise<SeoAnalyticsIds> {
  let row: Awaited<ReturnType<typeof getSeoSettingsRow>> | null = null;
  try {
    row = await getSeoSettingsRow();
  } catch {
    row = null;
  }
  return {
    indexingEnabled: Boolean(row?.indexingEnabled) && envIndexingFlag(source),
    envIndexingEnabled: envIndexingFlag(source),
    ga4MeasurementId: envOrDb("GA4_MEASUREMENT_ID", row?.ga4MeasurementId, source),
    gscVerification: envOrDb("GSC_VERIFICATION", row?.gscVerification, source),
    yandexMetrikaId: envOrDb("YANDEX_METRIKA_ID", row?.yandexMetrikaId, source),
    yandexWebmasterVerification: envOrDb(
      "YANDEX_WEBMASTER_VERIFICATION",
      row?.yandexWebmasterVerification,
      source,
    ),
    googleMerchantId: envOrDb("GOOGLE_MERCHANT_ID", row?.googleMerchantId, source),
  };
}

export type SeoSettingsInput = {
  indexingEnabled?: boolean;
  ga4MeasurementId?: string | null;
  gscVerification?: string | null;
  yandexMetrikaId?: string | null;
  yandexWebmasterVerification?: string | null;
  googleMerchantId?: string | null;
};

export async function updateSeoSettings(input: SeoSettingsInput) {
  const current = await getSeoSettingsRow();
  return withDatabase(() =>
    getPrismaClient().seoSettings.update({
      where: { id: current.id },
      data: {
        indexingEnabled:
          input.indexingEnabled !== undefined
            ? Boolean(input.indexingEnabled)
            : current.indexingEnabled,
        ga4MeasurementId:
          input.ga4MeasurementId !== undefined
            ? cleanId(input.ga4MeasurementId)
            : current.ga4MeasurementId,
        gscVerification:
          input.gscVerification !== undefined
            ? cleanId(input.gscVerification)
            : current.gscVerification,
        yandexMetrikaId:
          input.yandexMetrikaId !== undefined
            ? cleanId(input.yandexMetrikaId)
            : current.yandexMetrikaId,
        yandexWebmasterVerification:
          input.yandexWebmasterVerification !== undefined
            ? cleanId(input.yandexWebmasterVerification)
            : current.yandexWebmasterVerification,
        googleMerchantId:
          input.googleMerchantId !== undefined
            ? cleanId(input.googleMerchantId)
            : current.googleMerchantId,
      },
    }),
  );
}
