import type { AppModule } from "@/modules/types";

export const analyticsModule = {
  id: "analytics",
  stage: 10,
  summary:
    "GA4 + Yandex Metrika events, UTM attribution, admin KPI dashboard. Без PII; purchase только после verified payment; пустые ID = no-op.",
} satisfies AppModule;

export { ANALYTICS_EVENTS, METRIKA_GOALS } from "@/modules/analytics/events";
export type { AnalyticsEventName, AnalyticsParams, TrackInput } from "@/modules/analytics/events";
export { sanitizeAnalyticsParams, PII_PARAM_KEYS } from "@/modules/analytics/sanitize";
export {
  parseUtmFromSearchParams,
  buildAttributionSnapshot,
  attributionToPrisma,
  hasUtm,
  emptyUtm,
  ATTR_FIRST_COOKIE,
  ATTR_LAST_COOKIE,
  mergeAttributionFromLocation,
  readBrowserAttribution,
} from "@/modules/analytics/attribution";
export type { UtmParams, AttributionSnapshot } from "@/modules/analytics/attribution";
export {
  trackAnalyticsEvent,
  trackPageView,
  resolveAnalyticsIds,
  buildEcommerceItem,
} from "@/modules/analytics/track";
export {
  isVerifiedPaidOrder,
  purchaseEventParams,
  purchaseOrderCreatedParams,
  purchaseDedupeKey,
} from "@/modules/analytics/purchase-gate";
export { getAnalyticsKpis, formatMoneyCents } from "@/modules/analytics/kpi";
export type { AnalyticsKpi, SourceBucket } from "@/modules/analytics/kpi";
