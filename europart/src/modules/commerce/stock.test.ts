import { describe, expect, it } from "vitest";
import {
  importStockFlags,
  isStockConfirmed,
  toPublicStock,
} from "@/modules/commerce/stock";

describe("stock confirmation", () => {
  it("never confirms UNKNOWN", () => {
    expect(
      isStockConfirmed({ availabilityStatus: "UNKNOWN", stockConfirmed: true }),
    ).toBe(false);
  });

  it("hides quantity for unconfirmed offers on the storefront", () => {
    const view = toPublicStock({
      sourceType: "SUPPLIER",
      availabilityStatus: "IN_STOCK",
      stockSource: "SUPPLIER",
      stockConfirmed: false,
      quantity: 12,
      reservedQuantity: 2,
      stockUpdatedAt: new Date("2026-11-17T12:00:00.000Z"),
      leadTime: 3,
    });
    expect(view.availability).toBe("unknown");
    expect(view.quantityAvailable).toBeNull();
    expect(view.leadTimeDays).toBeNull();
    expect(view.channel).toBe("supplier");
  });

  it("exposes warehouse quantity when confirmed", () => {
    const view = toPublicStock({
      sourceType: "OWN_STOCK",
      availabilityStatus: "LOW_STOCK",
      stockSource: "WAREHOUSE",
      stockConfirmed: true,
      quantity: 5,
      reservedQuantity: 1,
      stockUpdatedAt: new Date("2026-11-17T12:00:00.000Z"),
      leadTime: 0,
    });
    expect(view).toMatchObject({
      channel: "warehouse",
      availability: "low_stock",
      quantityAvailable: 4,
      leadTimeDays: 0,
    });
  });

  it("maps on-order channel from availability", () => {
    expect(
      importStockFlags({ sourceType: "SUPPLIER", availability: "ON_ORDER" }),
    ).toEqual({
      stockSource: "ON_ORDER",
      stockConfirmed: true,
      availabilityStatus: "ON_ORDER",
    });
  });
});
