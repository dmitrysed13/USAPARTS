import { describe, expect, it } from "vitest";
import { sanitizeAnalyticsParams } from "@/modules/analytics/sanitize";

describe("sanitizeAnalyticsParams", () => {
  it("strips PII keys", () => {
    const cleaned = sanitizeAnalyticsParams({
      email: "a@b.by",
      phone: "+375291112233",
      name: "Ivan",
      vin: "WVWZZZ1JZYW386752",
      item_id: "OEM-123",
      value: 12.5,
    });
    expect(cleaned).toEqual({ item_id: "OEM-123", value: 12.5 });
  });

  it("drops string values that look like email/phone/VIN", () => {
    expect(
      sanitizeAnalyticsParams({
        note: "call +375 29 111-22-33",
        search_term: "1K0615301AA",
      }),
    ).toEqual({ search_term: "1K0615301AA" });
    expect(
      sanitizeAnalyticsParams({
        search_term: "user@example.com",
      }),
    ).toEqual({});
  });
});
