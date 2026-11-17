import { describe, expect, it } from "vitest";
import {
  ATTR_FIRST_COOKIE,
  ATTR_LAST_COOKIE,
  buildAttributionSnapshot,
  hasUtm,
  mergeAttributionFromLocation,
  parseUtmFromSearchParams,
  serializeAttribution,
} from "@/modules/analytics/attribution";

describe("UTM attribution", () => {
  it("parses utm_* from search params", () => {
    const utm = parseUtmFromSearchParams(
      new URLSearchParams(
        "utm_source=google&utm_medium=cpc&utm_campaign=brakes&utm_content=ad1&utm_term=oem",
      ),
    );
    expect(utm).toEqual({
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "brakes",
      utmContent: "ad1",
      utmTerm: "oem",
    });
    expect(hasUtm(utm)).toBe(true);
  });

  it("rejects email-like utm values", () => {
    const utm = parseUtmFromSearchParams({
      utm_source: "evil@mail.by",
      utm_medium: "cpc",
    });
    expect(utm.utmSource).toBeNull();
    expect(utm.utmMedium).toBe("cpc");
  });

  it("builds snapshot from cookies and body", () => {
    const first = serializeAttribution({
      utmSource: "yandex",
      utmMedium: "organic",
      utmCampaign: null,
      utmContent: null,
      utmTerm: null,
    });
    const last = serializeAttribution({
      utmSource: "google",
      utmMedium: "cpc",
      utmCampaign: "spring",
      utmContent: null,
      utmTerm: null,
    });
    const snap = buildAttributionSnapshot({
      firstCookie: first,
      lastCookie: last,
    });
    expect(snap.utmSource).toBe("google");
    expect(snap.firstTouchSource).toBe("yandex/organic");
    expect(snap.lastTouchSource).toBe("google/cpc/spring");
    expect(snap.capturedAt).toBeTruthy();
  });

  it("sets first cookie once and refreshes last", () => {
    const jar = new Map<string, string>();
    mergeAttributionFromLocation(
      "utm_source=first&utm_medium=cpc",
      (name) => jar.get(name) ?? null,
      (name, value) => {
        jar.set(name, value);
      },
    );
    expect(jar.has(ATTR_FIRST_COOKIE)).toBe(true);
    expect(jar.has(ATTR_LAST_COOKIE)).toBe(true);
    const firstValue = jar.get(ATTR_FIRST_COOKIE)!;
    mergeAttributionFromLocation(
      "utm_source=second&utm_medium=email",
      (name) => jar.get(name) ?? null,
      (name, value) => {
        jar.set(name, value);
      },
    );
    expect(jar.get(ATTR_FIRST_COOKIE)).toBe(firstValue);
    expect(jar.get(ATTR_LAST_COOKIE)).not.toBe(firstValue);
  });
});
