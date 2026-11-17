import { afterEach, describe, expect, it, vi } from "vitest";
import { trackAnalyticsEvent } from "@/modules/analytics/track";

describe("trackAnalyticsEvent", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    // @ts-expect-error test cleanup
    delete globalThis.window;
  });

  it("is a no-op when measurement IDs are empty", () => {
    const gtag = vi.fn();
    vi.stubGlobal("window", { gtag });
    const result = trackAnalyticsEvent({
      name: "add_to_cart",
      params: { item_id: "X", email: "leak@x.by" },
      ga4Id: null,
      metrikaId: "",
    });
    expect(result.fired).toBe(false);
    expect(gtag).not.toHaveBeenCalled();
    expect(result.params).toEqual({ item_id: "X" });
  });

  it("fires gtag and metrika when IDs are set", () => {
    const gtag = vi.fn();
    const ym = vi.fn();
    vi.stubGlobal("window", { gtag, ym });
    const result = trackAnalyticsEvent({
      name: "product_view",
      params: { item_id: "OEM-1", phone: "+37529" },
      ga4Id: "G-TEST",
      metrikaId: "123456",
    });
    expect(result.fired).toBe(true);
    expect(result.ga4).toBe(true);
    expect(result.metrika).toBe(true);
    expect(gtag).toHaveBeenCalledWith("event", "product_view", { item_id: "OEM-1" });
    expect(ym).toHaveBeenCalledWith("123456", "reachGoal", "product_view", {
      item_id: "OEM-1",
    });
  });
});
