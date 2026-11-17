import type { AnalyticsParams, AnalyticsPrimitive } from "@/modules/analytics/events";

/** Keys that must never leave the browser toward GA/Metrika. */
export const PII_PARAM_KEYS = new Set([
  "email",
  "phone",
  "name",
  "customername",
  "customeremail",
  "customerphone",
  "customercity",
  "address",
  "deliveryaddress",
  "comment",
  "message",
  "vin",
  "ip",
  "accesstoken",
  "token",
  "password",
  "authorization",
]);

const EMAIL_RE = /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i;
const PHONE_RE = /(?:\+?\d[\d\s().-]{7,}\d)/;
const VIN_RE = /\b[A-HJ-NPR-Z0-9]{17}\b/i;

function looksLikePiiString(value: string): boolean {
  const trimmed = value.trim();
  if (!trimmed) {
    return false;
  }
  if (EMAIL_RE.test(trimmed) || PHONE_RE.test(trimmed) || VIN_RE.test(trimmed)) {
    return true;
  }
  return false;
}

function sanitizePrimitive(value: AnalyticsPrimitive): AnalyticsPrimitive {
  if (typeof value !== "string") {
    return value;
  }
  if (looksLikePiiString(value)) {
    return undefined;
  }
  return value.slice(0, 120);
}

/**
 * Drop PII keys and values that look like email/phone/VIN.
 * Safe to call on every outbound analytics payload.
 */
export function sanitizeAnalyticsParams(
  params: AnalyticsParams | undefined | null,
): Record<string, string | number | boolean> {
  if (!params) {
    return {};
  }
  const out: Record<string, string | number | boolean> = {};
  for (const [rawKey, rawValue] of Object.entries(params)) {
    const key = rawKey.trim();
    if (!key) {
      continue;
    }
    if (PII_PARAM_KEYS.has(key.toLowerCase().replace(/[^a-z0-9]/g, ""))) {
      continue;
    }
    const cleaned = sanitizePrimitive(rawValue);
    if (cleaned === undefined || cleaned === null) {
      continue;
    }
    out[key.slice(0, 64)] = cleaned;
  }
  return out;
}
