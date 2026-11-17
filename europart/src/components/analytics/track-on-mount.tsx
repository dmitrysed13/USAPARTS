"use client";

import { useEffect, useRef } from "react";
import type { AnalyticsEventName, AnalyticsParams } from "@/modules/analytics/events";
import { trackAnalyticsEvent } from "@/modules/analytics/track";

/** Fire a single analytics event once after mount (product_view, search, begin_checkout…). */
export function TrackOnMount({
  name,
  params,
}: {
  name: AnalyticsEventName;
  params?: AnalyticsParams;
}) {
  const fired = useRef(false);
  useEffect(() => {
    if (fired.current) {
      return;
    }
    fired.current = true;
    trackAnalyticsEvent({ name, params });
  }, [name, params]);
  return null;
}
