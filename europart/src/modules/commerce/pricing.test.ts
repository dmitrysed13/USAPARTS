import { describe, expect, it } from "vitest";
import {
  resolveAudience,
  toPublicOffer,
  type InternalOffer,
} from "@/modules/commerce/pricing";

const fixture: InternalOffer = {
  offerId: "fixture-offer",
  availability: "in_stock",
  quantityAvailable: 4,
  reserved: 1,
  leadTimeDays: 2,
  retailPriceMinor: 10_000,
  b2bPriceMinor: 8_000,
  costPriceMinor: 5_500,
  supplierName: "SECRET_SUPPLIER",
};

describe("public prices", () => {
  it("shows the retail price and hides purchase data", () => {
    const offer = toPublicOffer(fixture, "retail");
    const serialized = JSON.stringify(offer);

    expect(offer.priceMinor).toBe(10_000);
    expect(offer.priceKind).toBe("retail");
    expect(serialized).not.toContain("SECRET_SUPPLIER");
    expect(serialized).not.toContain("costPriceMinor");
    expect(serialized).not.toContain("b2bPriceMinor");
    expect(serialized).not.toContain("5500");
    expect(serialized).not.toContain('"reserved"');
  });

  it("does not replace a missing wholesale price with the retail price", () => {
    const offer = toPublicOffer({ ...fixture, b2bPriceMinor: null }, "b2b");
    expect(offer.priceMinor).toBeNull();
  });

  it("keeps wholesale prices away from an unapproved organization", () => {
    expect(resolveAudience({})).toBe("retail");
    expect(resolveAudience({ organizationStatus: "pending" })).toBe("retail");
    expect(resolveAudience({ organizationStatus: "rejected" })).toBe("retail");
    expect(resolveAudience({ organizationStatus: "approved" })).toBe("b2b");
  });
});
