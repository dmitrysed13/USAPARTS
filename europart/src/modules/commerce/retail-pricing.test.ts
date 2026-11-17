import { describe, expect, it } from "vitest";
import {
  computeRetailPrice,
  convertToByn,
  selectMarkupRule,
  toManagerPriceView,
} from "@/modules/commerce/retail-pricing";

describe("FX convert", () => {
  it("passes BYN through without a rate row", () => {
    expect(convertToByn(12.345, "BYN", null)).toEqual({
      amount: 12.35,
      rate: 1,
      source: "identity",
      reason: null,
    });
  });

  it("refuses EUR without a configured rate", () => {
    const result = convertToByn(10, "EUR", null);
    expect(result.amount).toBeNull();
    expect(result.reason).toMatch(/Нет настроенного курса/);
  });

  it("converts with a configured rate", () => {
    expect(
      convertToByn(10, "EUR", {
        rate: 3.5,
        source: "manual",
        effectiveFrom: new Date("2026-01-01"),
      }),
    ).toMatchObject({ amount: 35, rate: 3.5, source: "manual", reason: null });
  });
});

describe("markup", () => {
  it("prefers lower priority number", () => {
    const chosen = selectMarkupRule([
      {
        id: "b",
        name: "brand",
        scope: "PART_BRAND",
        markupType: "PERCENT",
        value: 40,
        b2bValue: 20,
        priority: 20,
      },
      {
        id: "g",
        name: "global",
        scope: "GLOBAL",
        markupType: "PERCENT",
        value: 50,
        b2bValue: null,
        priority: 100,
      },
    ]);
    expect(chosen?.id).toBe("b");
  });

  it("computes retail and b2b from purchase + FX + markup + extras", () => {
    const result = computeRetailPrice({
      purchaseAmount: 100,
      purchaseCurrency: "EUR",
      extrasAmount: 5,
      fx: { rate: 3, source: "manual", effectiveFrom: new Date() },
      rule: {
        id: "r1",
        name: "supplier",
        scope: "SUPPLIER",
        markupType: "PERCENT",
        value: 20,
        b2bValue: 10,
        priority: 10,
      },
    });
    // 100 EUR * 3 = 300 BYN + 5 extras = 305; +20% = 366; b2b +10% = 335.5
    expect(result.convertedAmount).toBe(300);
    expect(result.retailAmount).toBe(366);
    expect(result.b2bAmount).toBe(335.5);
    expect(result.reason).toBeNull();
  });

  it("does not invent retail without a markup rule", () => {
    const result = computeRetailPrice({
      purchaseAmount: 10,
      purchaseCurrency: "BYN",
      fx: null,
      rule: null,
    });
    expect(result.retailAmount).toBeNull();
    expect(result.reason).toMatch(/наценки/);
  });
});

describe("manager view", () => {
  it("exposes cost and margin for staff only", () => {
    expect(
      toManagerPriceView({
        purchaseAmount: 100,
        purchaseCurrency: "BYN",
        retailAmount: 150,
        b2bAmount: 120,
      }),
    ).toEqual({
      purchaseAmount: 100,
      purchaseCurrency: "BYN",
      retailAmount: 150,
      b2bAmount: 120,
      marginAmount: 50,
      marginPercent: 50,
      currency: "BYN",
    });
  });
});
