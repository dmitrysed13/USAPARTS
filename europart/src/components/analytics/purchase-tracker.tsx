"use client";

import { useEffect, useRef } from "react";
import {
  isVerifiedPaidOrder,
  purchaseDedupeKey,
  purchaseEventParams,
} from "@/modules/analytics/purchase-gate";
import { trackAnalyticsEvent } from "@/modules/analytics/track";

/**
 * Emits GA4/Metrika `purchase` only when payment is verified (PAID).
 * Deduped per order number in localStorage. Empty IDs → no-op via trackAnalyticsEvent.
 */
export function PurchaseTracker({
  order,
}: {
  order: {
    number: string;
    totalCents: number;
    currency: string;
    paymentState: string;
    status: string;
  };
}) {
  const attempted = useRef(false);

  useEffect(() => {
    if (attempted.current) {
      return;
    }
    attempted.current = true;
    if (!isVerifiedPaidOrder(order)) {
      return;
    }
    const key = purchaseDedupeKey(order.number);
    try {
      if (typeof localStorage !== "undefined" && localStorage.getItem(key) === "1") {
        return;
      }
    } catch {
      // ignore storage failures
    }
    const result = trackAnalyticsEvent({
      name: "purchase",
      params: purchaseEventParams(order),
    });
    if (result.fired) {
      try {
        localStorage.setItem(key, "1");
      } catch {
        // ignore
      }
    }
  }, [order]);

  return null;
}
