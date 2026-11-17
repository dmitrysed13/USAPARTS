import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";
import { company as fallbackCompany } from "@/config/company";

export type CompanySettingsInput = {
  orgName?: string | null;
  legalName?: string | null;
  unp?: string | null;
  legalAddress?: string | null;
  actualAddress?: string | null;
  phones?: string | null;
  email?: string | null;
  hours?: string | null;
  publishToStorefront?: boolean;
};

export type StorefrontCompany = {
  brand: string;
  legalName: string | null;
  unp: string | null;
  legalAddress: string | null;
  actualAddress: string | null;
  phoneDisplay: string;
  phoneTel: string;
  email: string;
  hoursText: string | null;
  publishedFromAdmin: boolean;
  /** True when legal/UNP blocks may render on the storefront. */
  showLegalBlock: boolean;
};

function clean(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  return trimmed ? trimmed.slice(0, 500) : null;
}

export function companySettingsComplete(row: {
  legalName: string | null;
  unp: string | null;
  legalAddress: string | null;
  phones: string | null;
  email: string | null;
}): boolean {
  return Boolean(
    row.legalName?.trim() &&
      row.unp?.trim() &&
      row.legalAddress?.trim() &&
      row.phones?.trim() &&
      row.email?.trim(),
  );
}

export async function getCompanySettings() {
  return withDatabase(async () => {
    const prisma = getPrismaClient();
    const existing = await prisma.companySettings.findFirst({
      orderBy: { createdAt: "asc" },
    });
    if (existing) {
      return existing;
    }
    return prisma.companySettings.create({
      data: { publishToStorefront: false },
    });
  });
}

export async function updateCompanySettings(input: CompanySettingsInput) {
  const current = await getCompanySettings();
  const next = {
    orgName: input.orgName !== undefined ? clean(input.orgName) : current.orgName,
    legalName: input.legalName !== undefined ? clean(input.legalName) : current.legalName,
    unp: input.unp !== undefined ? clean(input.unp) : current.unp,
    legalAddress:
      input.legalAddress !== undefined ? clean(input.legalAddress) : current.legalAddress,
    actualAddress:
      input.actualAddress !== undefined ? clean(input.actualAddress) : current.actualAddress,
    phones: input.phones !== undefined ? clean(input.phones) : current.phones,
    email: input.email !== undefined ? clean(input.email) : current.email,
    hours: input.hours !== undefined ? clean(input.hours) : current.hours,
    publishToStorefront:
      input.publishToStorefront !== undefined
        ? Boolean(input.publishToStorefront)
        : current.publishToStorefront,
  };
  if (next.publishToStorefront && !companySettingsComplete(next)) {
    throw new Error(
      "Нельзя публиковать на витрину: заполните юр. название, УНП, юр. адрес, телефоны и email.",
    );
  }
  return withDatabase(() =>
    getPrismaClient().companySettings.update({
      where: { id: current.id },
      data: next,
    }),
  );
}

/**
 * Storefront reader. Empty admin stubs never invent legal data.
 * Until admin explicitly publishes a complete profile, legal/UNP stay hidden
 * and contact falls back to verified static facts from config/company.ts.
 */
export async function getStorefrontCompany(): Promise<StorefrontCompany> {
  try {
    const settings = await getCompanySettings();
    if (settings.publishToStorefront && companySettingsComplete(settings)) {
      const phone = settings.phones!.split(/[,;]/)[0]!.trim();
      const digits = phone.replace(/\D/g, "");
      return {
        brand: fallbackCompany.brand,
        legalName: settings.legalName,
        unp: settings.unp,
        legalAddress: settings.legalAddress,
        actualAddress: settings.actualAddress,
        phoneDisplay: phone,
        phoneTel: digits ? `+${digits}` : fallbackCompany.phoneTel,
        email: settings.email!,
        hoursText: settings.hours,
        publishedFromAdmin: true,
        showLegalBlock: true,
      };
    }
  } catch {
    // DB unavailable → static fallback without claiming admin-published legal.
  }
  return {
    brand: fallbackCompany.brand,
    legalName: null,
    unp: null,
    legalAddress: null,
    actualAddress: null,
    phoneDisplay: fallbackCompany.phoneDisplay,
    phoneTel: fallbackCompany.phoneTel,
    email: fallbackCompany.email,
    hoursText: fallbackCompany.hours
      .map((slot) => `${slot.days}: ${slot.time}`)
      .join(" · "),
    publishedFromAdmin: false,
    showLegalBlock: false,
  };
}
