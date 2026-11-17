"use client";

import { useEffect } from "react";
import { usePathname, useSearchParams } from "next/navigation";
import {
  ATTR_COOKIE_MAX_AGE_SEC,
  ATTR_FIRST_COOKIE,
  ATTR_LAST_COOKIE,
  mergeAttributionFromLocation,
} from "@/modules/analytics/attribution";
import { trackPageView } from "@/modules/analytics/track";

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

function writeCookie(name: string, value: string, maxAgeSec: number): void {
  const secure = typeof location !== "undefined" && location.protocol === "https:" ? "; Secure" : "";
  document.cookie = `${name}=${encodeURIComponent(value)}; Path=/; Max-Age=${maxAgeSec}; SameSite=Lax${secure}`;
}

/**
 * Captures UTM first/last touch into cookies and sends a page_view/hit when IDs exist.
 */
export function AttributionCapture() {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  useEffect(() => {
    const search = searchParams?.toString() ?? "";
    mergeAttributionFromLocation(search, readCookie, writeCookie);
    if (pathname) {
      trackPageView(pathname + (search ? `?${search}` : ""));
    }
  }, [pathname, searchParams]);

  // Keep cookie names referenced so tree-shaking does not drop exports used only via merge.
  void ATTR_FIRST_COOKIE;
  void ATTR_LAST_COOKIE;
  void ATTR_COOKIE_MAX_AGE_SEC;

  return null;
}
