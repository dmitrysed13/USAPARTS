import { describe, expect, it } from "vitest";
import { IntegrationNotConfiguredError } from "@/modules/integrations/ports";
import {
  resetRateBuckets,
  takeRateToken,
  unconfiguredSupplierAdapter,
  withRetry,
  SupplierAdapterError,
} from "@/modules/integrations/supplier-adapter";

describe("SupplierAdapter", () => {
  it("fails closed when no adapter is configured", async () => {
    await expect(unconfiguredSupplierAdapter.getProducts()).rejects.toBeInstanceOf(
      IntegrationNotConfiguredError,
    );
    await expect(unconfiguredSupplierAdapter.sync("FULL")).rejects.toThrow(/не подключена/);
  });

  it("retries retryable errors then succeeds", async () => {
    let calls = 0;
    const value = await withRetry(
      async () => {
        calls += 1;
        if (calls < 3) {
          throw new SupplierAdapterError("temporary", true);
        }
        return "ok";
      },
      { attempts: 3, delayMs: 1 },
    );
    expect(value).toBe("ok");
    expect(calls).toBe(3);
  });

  it("rate-limits bursts", () => {
    resetRateBuckets();
    const now = Date.now();
    expect(takeRateToken("t", 2, now)).toBe(true);
    expect(takeRateToken("t", 2, now)).toBe(true);
    expect(takeRateToken("t", 2, now)).toBe(false);
    expect(takeRateToken("t", 2, now + 60_000)).toBe(true);
  });
});
