/**
 * EUROPART storefront analytics events (final-spec §10).
 * Payloads must never include customer PII (name, phone, email, address, VIN, IP).
 */

export const ANALYTICS_EVENTS = [
  "product_view",
  "search",
  "vin_search",
  "add_to_cart",
  "begin_checkout",
  "purchase_order_created",
  "purchase",
  "lead_submit",
] as const;

export type AnalyticsEventName = (typeof ANALYTICS_EVENTS)[number];

/** Yandex Metrika goal names mirror GA4 event names for ops simplicity. */
export const METRIKA_GOALS: Record<AnalyticsEventName, string> = {
  product_view: "product_view",
  search: "search",
  vin_search: "vin_search",
  add_to_cart: "add_to_cart",
  begin_checkout: "begin_checkout",
  purchase_order_created: "purchase_order_created",
  purchase: "purchase",
  lead_submit: "lead_submit",
};

export type AnalyticsPrimitive = string | number | boolean | null | undefined;

export type AnalyticsParams = Record<string, AnalyticsPrimitive>;

export type TrackInput = {
  name: AnalyticsEventName;
  params?: AnalyticsParams;
  ga4Id?: string | null;
  metrikaId?: string | null;
};
