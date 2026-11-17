import { describe, expect, it } from "vitest";
import {
  isVerifiedPaidOrder,
  purchaseDedupeKey,
  purchaseEventParams,
  purchaseOrderCreatedParams,
} from "@/modules/analytics/purchase-gate";

describe("purchase gate", () => {
  it("allows purchase only for verified paid orders", () => {
    expect(
      isVerifiedPaidOrder({
        paymentState: "AWAITING",
        status: "NEW",
        number: "EP-1",
        totalCents: 1000,
        currency: "BYN",
      }),
    ).toBe(false);
    expect(
      isVerifiedPaidOrder({
        paymentState: "PAID",
        status: "NEW",
        number: "EP-1",
        totalCents: 1000,
        currency: "BYN",
      }),
    ).toBe(true);
    expect(
      isVerifiedPaidOrder({
        paymentState: "NOT_CONNECTED",
        status: "PAID",
        number: "EP-1",
        totalCents: 1000,
        currency: "BYN",
      }),
    ).toBe(true);
  });

  it("builds purchase payloads without customer fields", () => {
    const created = purchaseOrderCreatedParams({
      number: "EP-2026-000001",
      totalCents: 2599,
      currency: "BYN",
      checkoutMode: "MANAGER",
    });
    const purchase = purchaseEventParams({
      number: "EP-2026-000001",
      totalCents: 2599,
      currency: "BYN",
      paymentState: "PAID",
      status: "PAID",
    });
    expect(created).toEqual({
      transaction_id: "EP-2026-000001",
      value: 25.99,
      currency: "BYN",
      checkout_mode: "MANAGER",
    });
    expect(purchase).toEqual({
      transaction_id: "EP-2026-000001",
      value: 25.99,
      currency: "BYN",
    });
    expect(JSON.stringify(created)).not.toMatch(/phone|email|name|vin/i);
    expect(purchaseDedupeKey("EP-2026-000001")).toContain("EP-2026-000001");
  });
});
