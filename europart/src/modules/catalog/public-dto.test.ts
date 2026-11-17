import { describe, expect, it } from "vitest";
import { selectPublicOffer, toPublicProduct } from "@/modules/catalog/public-dto";

describe("public product DTO", () => {
  it("drops purchase price, b2b price and supplier data", () => {
    const product = toPublicProduct({
      id: "product-1",
      name: "Колодка",
      slug: "kolodka",
      description: null,
      article: "GDB1",
      oem: null,
      condition: "NEW",
      productType: "ANALOG",
      weight: null,
      category: { name: "Колодки", slug: "kolodki" },
      partBrand: null,
      images: [],
      identifiers: [
        { value: "1K0 615 301 AA", type: "OEM", isPrimary: true },
        { value: "SECRET-CROSS", type: "CROSS_REFERENCE", isPrimary: false },
      ],
      compatibility: [
        {
          confidence: "UNVERIFIED",
          brandName: "Скрытая",
          brandSlug: "hidden",
          modelName: "Модель",
          modelSlug: "model",
          modificationName: "1.4",
          yearFrom: null,
          yearTo: null,
        },
        {
          confidence: "VERIFIED",
          brandName: "Volkswagen",
          brandSlug: "volkswagen",
          modelName: "Golf",
          modelSlug: "golf",
          modificationName: "1.4 TSI",
          yearFrom: 2013,
          yearTo: 2017,
        },
      ],
      offers: [
        {
          retailPrice: { toFixed: () => "50.00" },
          currency: "BYN",
          availabilityStatus: "IN_STOCK",
          leadTime: 1,
          purchasePrice: { toFixed: () => "12345.67" },
          b2bPrice: { toFixed: () => "999.01" },
          supplierId: "supplier-secret",
          supplierName: "SECRET-SUPPLIER",
        },
      ],
    });
    const serialized = JSON.stringify(product);

    expect(product.price).toEqual({ amount: "50.00", currency: "BYN" });
    expect(product.availability).toBe("in_stock");
    expect(product.oem).toBe("1K0 615 301 AA");
    expect(product.compatibility).toHaveLength(1);
    expect(product.compatibility[0]?.brandName).toBe("Volkswagen");
    expect(serialized).not.toContain("12345.67");
    expect(serialized).not.toContain("999.01");
    expect(serialized).not.toContain("SECRET-SUPPLIER");
    expect(serialized).not.toContain("supplier-secret");
    expect(serialized).not.toContain("purchasePrice");
    expect(serialized).not.toContain("b2bPrice");
    expect(serialized).not.toContain("Скрытая");
  });

  it("does not call unknown availability in stock", () => {
    expect(
      selectPublicOffer([
        {
          retailPrice: { toFixed: () => "10.00" },
          currency: "BYN",
          availabilityStatus: "UNKNOWN",
          leadTime: 5,
        },
      ]),
    ).toEqual({
      price: { amount: "10.00", currency: "BYN" },
      availability: "unknown",
      leadTimeDays: null,
    });
    expect(selectPublicOffer([])).toEqual({
      price: null,
      availability: "unknown",
      leadTimeDays: null,
    });
  });
});
