import { describe, expect, it } from "vitest";
import {
  decodeVinOrUnavailable,
  unconfiguredVinCatalog,
  type VinCatalogPort,
} from "@/modules/vin/vin-catalog";

describe("VinCatalog adapter", () => {
  it("never invents a vehicle from an unconfigured decoder", async () => {
    const result = await unconfiguredVinCatalog.decode("WVWZZZ3CZWE123456");
    expect(result.decoded).toBe(false);
    if (!result.decoded) {
      expect(result.reason).toBe("not_configured");
    }
  });

  it("passes through a real adapter only when decoded=true", async () => {
    const adapter: VinCatalogPort = {
      key: "fixture",
      async decode(vin) {
        return {
          vin,
          decoded: true,
          make: "VW",
          model: "Golf",
          year: 2015,
        };
      },
    };
    const result = await decodeVinOrUnavailable("WVWZZZ3CZWE123456", adapter);
    expect(result.decoded).toBe(true);
    if (result.decoded) {
      expect(result.make).toBe("VW");
    }
  });
});
