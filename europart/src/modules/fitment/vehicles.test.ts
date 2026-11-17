import { describe, expect, it } from "vitest";
import { slugify } from "@/lib/slug";
import { VehicleAdminError } from "@/modules/fitment/vehicles";

describe("vehicle admin helpers", () => {
  it("slugifies modification names", () => {
    expect(slugify("1.4 TSI")).toBe("1-4-tsi");
  });

  it("exposes admin error type", () => {
    expect(new VehicleAdminError("Нужен brandId.").name).toBe("VehicleAdminError");
  });
});
