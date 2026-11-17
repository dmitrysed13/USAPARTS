"use client";

import {
  ATTR_FIRST_COOKIE,
  ATTR_LAST_COOKIE,
  readBrowserAttribution,
  type AttributionSnapshot,
} from "@/modules/analytics/attribution";

function readCookie(name: string): string | null {
  if (typeof document === "undefined") {
    return null;
  }
  const match = document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`));
  if (!match) {
    return null;
  }
  return decodeURIComponent(match.slice(name.length + 1));
}

/** Snapshot suitable for checkout/lead POST bodies (no PII). */
export function getClientAttributionPayload(): AttributionSnapshot {
  void ATTR_FIRST_COOKIE;
  void ATTR_LAST_COOKIE;
  return readBrowserAttribution(readCookie);
}
