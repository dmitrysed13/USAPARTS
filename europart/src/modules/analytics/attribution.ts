import { z } from "zod";

export const ATTR_FIRST_COOKIE = "ep_attr_first";
export const ATTR_LAST_COOKIE = "ep_attr_last";
export const ATTR_COOKIE_MAX_AGE_SEC = 60 * 60 * 24 * 90;

const utmSchema = z.object({
  utmSource: z.string().trim().max(80).optional(),
  utmMedium: z.string().trim().max(80).optional(),
  utmCampaign: z.string().trim().max(120).optional(),
  utmContent: z.string().trim().max(120).optional(),
  utmTerm: z.string().trim().max(120).optional(),
});

export type UtmParams = {
  utmSource: string | null;
  utmMedium: string | null;
  utmCampaign: string | null;
  utmContent: string | null;
  utmTerm: string | null;
};

export type AttributionSnapshot = UtmParams & {
  firstTouchSource: string | null;
  lastTouchSource: string | null;
  capturedAt: string | null;
};

function cleanToken(value: string | null | undefined): string | null {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    return null;
  }
  // Reject values that look like contact data.
  if (/@/.test(trimmed) || /^\+?\d[\d\s().-]{6,}$/.test(trimmed)) {
    return null;
  }
  return trimmed.slice(0, 120);
}

function sourceLabel(utm: UtmParams): string | null {
  if (!utm.utmSource && !utm.utmMedium && !utm.utmCampaign) {
    return null;
  }
  const parts = [utm.utmSource, utm.utmMedium, utm.utmCampaign].filter(Boolean);
  return parts.join("/") || null;
}

export function emptyUtm(): UtmParams {
  return {
    utmSource: null,
    utmMedium: null,
    utmCampaign: null,
    utmContent: null,
    utmTerm: null,
  };
}

export function parseUtmFromSearchParams(
  input: URLSearchParams | Record<string, string | string[] | undefined | null>,
): UtmParams {
  const read = (key: string): string | null => {
    if (input instanceof URLSearchParams) {
      return cleanToken(input.get(key));
    }
    const raw = input[key];
    const value = Array.isArray(raw) ? raw[0] : raw;
    return cleanToken(value);
  };
  return {
    utmSource: read("utm_source"),
    utmMedium: read("utm_medium"),
    utmCampaign: read("utm_campaign"),
    utmContent: read("utm_content"),
    utmTerm: read("utm_term"),
  };
}

export function hasUtm(utm: UtmParams): boolean {
  return Boolean(
    utm.utmSource || utm.utmMedium || utm.utmCampaign || utm.utmContent || utm.utmTerm,
  );
}

export function serializeAttribution(utm: UtmParams): string {
  return JSON.stringify({
    utmSource: utm.utmSource,
    utmMedium: utm.utmMedium,
    utmCampaign: utm.utmCampaign,
    utmContent: utm.utmContent,
    utmTerm: utm.utmTerm,
    at: new Date().toISOString(),
  });
}

export function parseAttributionCookie(raw: string | null | undefined): UtmParams {
  if (!raw?.trim()) {
    return emptyUtm();
  }
  try {
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const result = utmSchema.safeParse({
      utmSource: typeof parsed.utmSource === "string" ? parsed.utmSource : undefined,
      utmMedium: typeof parsed.utmMedium === "string" ? parsed.utmMedium : undefined,
      utmCampaign:
        typeof parsed.utmCampaign === "string" ? parsed.utmCampaign : undefined,
      utmContent: typeof parsed.utmContent === "string" ? parsed.utmContent : undefined,
      utmTerm: typeof parsed.utmTerm === "string" ? parsed.utmTerm : undefined,
    });
    if (!result.success) {
      return emptyUtm();
    }
    return {
      utmSource: cleanToken(result.data.utmSource),
      utmMedium: cleanToken(result.data.utmMedium),
      utmCampaign: cleanToken(result.data.utmCampaign),
      utmContent: cleanToken(result.data.utmContent),
      utmTerm: cleanToken(result.data.utmTerm),
    };
  } catch {
    return emptyUtm();
  }
}

/**
 * Build a DB-ready attribution snapshot from first/last cookies + optional request body.
 * Prefer last-touch UTM fields; keep first/last source labels for dashboard rollups.
 */
export function buildAttributionSnapshot(input: {
  firstCookie?: string | null;
  lastCookie?: string | null;
  body?: Partial<UtmParams> & {
    firstTouchSource?: string | null;
    lastTouchSource?: string | null;
  };
}): AttributionSnapshot {
  const first = parseAttributionCookie(input.firstCookie);
  const last = parseAttributionCookie(input.lastCookie);
  const bodyUtm: UtmParams = {
    utmSource: cleanToken(input.body?.utmSource),
    utmMedium: cleanToken(input.body?.utmMedium),
    utmCampaign: cleanToken(input.body?.utmCampaign),
    utmContent: cleanToken(input.body?.utmContent),
    utmTerm: cleanToken(input.body?.utmTerm),
  };
  const touch = hasUtm(bodyUtm) ? bodyUtm : hasUtm(last) ? last : first;
  const firstSource =
    cleanToken(input.body?.firstTouchSource) ?? sourceLabel(first) ?? sourceLabel(touch);
  const lastSource =
    cleanToken(input.body?.lastTouchSource) ?? sourceLabel(touch) ?? sourceLabel(last);

  return {
    ...touch,
    firstTouchSource: firstSource,
    lastTouchSource: lastSource,
    capturedAt: hasUtm(touch) || firstSource || lastSource ? new Date().toISOString() : null,
  };
}

export function attributionToPrisma(snapshot: AttributionSnapshot) {
  return {
    utmSource: snapshot.utmSource,
    utmMedium: snapshot.utmMedium,
    utmCampaign: snapshot.utmCampaign,
    utmContent: snapshot.utmContent,
    utmTerm: snapshot.utmTerm,
    firstTouchSource: snapshot.firstTouchSource,
    lastTouchSource: snapshot.lastTouchSource,
    attributionCapturedAt: snapshot.capturedAt ? new Date(snapshot.capturedAt) : null,
  };
}

/** Browser helper: merge URL UTMs into first/last cookies. */
export function mergeAttributionFromLocation(
  search: string,
  readCookie: (name: string) => string | null,
  writeCookie: (name: string, value: string, maxAgeSec: number) => void,
): AttributionSnapshot {
  const utm = parseUtmFromSearchParams(new URLSearchParams(search.startsWith("?") ? search : `?${search}`));
  const existingFirst = parseAttributionCookie(readCookie(ATTR_FIRST_COOKIE));
  const existingLast = parseAttributionCookie(readCookie(ATTR_LAST_COOKIE));

  if (hasUtm(utm)) {
    writeCookie(ATTR_LAST_COOKIE, serializeAttribution(utm), ATTR_COOKIE_MAX_AGE_SEC);
    if (!hasUtm(existingFirst)) {
      writeCookie(ATTR_FIRST_COOKIE, serializeAttribution(utm), ATTR_COOKIE_MAX_AGE_SEC);
    }
  }

  const first = hasUtm(utm) && !hasUtm(existingFirst) ? utm : existingFirst;
  const last = hasUtm(utm) ? utm : existingLast;
  return {
    ...last,
    firstTouchSource: sourceLabel(first),
    lastTouchSource: sourceLabel(last),
    capturedAt: new Date().toISOString(),
  };
}

export function readBrowserAttribution(
  readCookie: (name: string) => string | null,
): AttributionSnapshot {
  const first = parseAttributionCookie(readCookie(ATTR_FIRST_COOKIE));
  const last = parseAttributionCookie(readCookie(ATTR_LAST_COOKIE));
  const touch = hasUtm(last) ? last : first;
  return {
    ...touch,
    firstTouchSource: sourceLabel(first),
    lastTouchSource: sourceLabel(last),
    capturedAt: null,
  };
}
