import {
  METRIKA_GOALS,
  type AnalyticsEventName,
  type AnalyticsParams,
  type TrackInput,
} from "@/modules/analytics/events";
import { sanitizeAnalyticsParams } from "@/modules/analytics/sanitize";

type GtagFn = (...args: unknown[]) => void;
type YmFn = (id: number | string, method: string, ...rest: unknown[]) => void;

function readMeta(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const el = document.querySelector(`meta[name="${name}"]`);
  const content = el?.getAttribute("content")?.trim() ?? "";
  return content || null;
}

export function resolveAnalyticsIds(input?: {
  ga4Id?: string | null;
  metrikaId?: string | null;
}): { ga4Id: string | null; metrikaId: string | null } {
  return {
    ga4Id: input?.ga4Id?.trim() || readMeta("europart-ga4-id"),
    metrikaId: input?.metrikaId?.trim() || readMeta("europart-metrika-id"),
  };
}

/**
 * Fire a storefront event. Empty measurement IDs → no-op (no scripts, no network).
 * Never throws; never sends unsanitized params.
 */
export function trackAnalyticsEvent(input: TrackInput): {
  fired: boolean;
  ga4: boolean;
  metrika: boolean;
  params: Record<string, string | number | boolean>;
} {
  const ids = resolveAnalyticsIds(input);
  const params = sanitizeAnalyticsParams(input.params);
  if (!ids.ga4Id && !ids.metrikaId) {
    return { fired: false, ga4: false, metrika: false, params };
  }

  let ga4 = false;
  let metrika = false;

  if (ids.ga4Id && typeof window !== "undefined") {
    const gtag = (window as Window & { gtag?: GtagFn }).gtag;
    if (typeof gtag === "function") {
      gtag("event", input.name, params);
      ga4 = true;
    }
  }

  if (ids.metrikaId && typeof window !== "undefined") {
    const ym = (window as Window & { ym?: YmFn }).ym;
    if (typeof ym === "function") {
      const goal = METRIKA_GOALS[input.name];
      ym(ids.metrikaId, "reachGoal", goal, params);
      metrika = true;
    }
  }

  return { fired: ga4 || metrika, ga4, metrika, params };
}

export function trackPageView(path: string, ids?: { ga4Id?: string | null; metrikaId?: string | null }) {
  const resolved = resolveAnalyticsIds(ids);
  if (!resolved.ga4Id && !resolved.metrikaId) {
    return { fired: false };
  }
  if (resolved.ga4Id && typeof window !== "undefined") {
    const gtag = (window as Window & { gtag?: GtagFn }).gtag;
    gtag?.("event", "page_view", { page_path: path.slice(0, 200) });
  }
  if (resolved.metrikaId && typeof window !== "undefined") {
    const ym = (window as Window & { ym?: YmFn }).ym;
    ym?.(resolved.metrikaId, "hit", path.slice(0, 200));
  }
  return { fired: true };
}

export function isAnalyticsEventName(value: string): value is AnalyticsEventName {
  return value in METRIKA_GOALS;
}

export function buildEcommerceItem(input: {
  itemId?: string | null;
  itemName?: string | null;
  price?: number | null;
  quantity?: number | null;
}): AnalyticsParams {
  return sanitizeAnalyticsParams({
    item_id: input.itemId?.slice(0, 64) ?? undefined,
    item_name: input.itemName?.slice(0, 120) ?? undefined,
    value: input.price ?? undefined,
    quantity: input.quantity ?? undefined,
    currency: "BYN",
  });
}
