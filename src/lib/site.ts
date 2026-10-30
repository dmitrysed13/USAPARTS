import { cacheWrap } from "@/lib/cache";
import { prisma } from "@/lib/db";

export function getSiteUrl() {
  const raw = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";
  return raw.replace(/\/$/, "");
}

export type SiteSettings = {
  companyName: string;
  phone: string;
  email: string;
  telegram: string;
  whatsapp: string;
  address: string;
  hours: string;
  demoMode: boolean;
};

const FALLBACK: SiteSettings = {
  companyName: "USAPARTS",
  phone: "",
  email: "",
  telegram: "",
  whatsapp: "",
  address: "",
  hours: "",
  demoMode: true,
};

export async function getSettings(): Promise<SiteSettings> {
  return cacheWrap("settings", 60, async () => {
    const rows = await prisma.siteSetting.findMany();
    const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return {
      companyName: map.companyName || FALLBACK.companyName,
      phone: map.phone || "",
      email: map.email || "",
      telegram: map.telegram || "",
      whatsapp: map.whatsapp || "",
      address: map.address || "",
      hours: map.hours || "",
      demoMode: map.demoMode !== "false",
    };
  });
}

export function absoluteUrl(path: string) {
  if (path.startsWith("http")) return path;
  return `${getSiteUrl()}${path.startsWith("/") ? path : `/${path}`}`;
}
