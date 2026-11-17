import { describe, expect, it } from "vitest";
import {
  decodeSelectedVehicle,
  encodeSelectedVehicle,
  normalizeSelectedVehicle,
  vehicleHref,
} from "@/modules/fitment/vehicle-cookie";

const secret = "test-vehicle-secret-16";

describe("selected vehicle cookie", () => {
  it("round-trips a full hierarchy", () => {
    const encoded = encodeSelectedVehicle(
      {
        brandSlug: "vw",
        brandName: "VW",
        modelSlug: "golf",
        modelName: "Golf",
        generationSlug: "vii",
        generationName: "VII",
        modificationSlug: "1-4-tsi",
        modificationName: "1.4 TSI",
        engineSlug: "czca",
        engineName: "CZCA",
      },
      secret,
    );
    const decoded = decodeSelectedVehicle(encoded, secret);
    expect(decoded?.engineSlug).toBe("czca");
    expect(vehicleHref(decoded!)).toBe("/brands/vw/golf/vii/1-4-tsi/czca");
  });

  it("rejects tampered payload", () => {
    const encoded = encodeSelectedVehicle(
      { brandSlug: "bmw", brandName: "BMW" },
      secret,
    );
    expect(decodeSelectedVehicle(`${encoded}x`, secret)).toBeNull();
  });

  it("drops deeper levels without parents", () => {
    expect(
      normalizeSelectedVehicle({
        brandSlug: "audi",
        brandName: "Audi",
        engineSlug: "cbb",
        engineName: "CBB",
      }),
    ).toEqual({ brandSlug: "audi", brandName: "Audi" });
  });
});
