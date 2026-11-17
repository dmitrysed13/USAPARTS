import { describe, expect, it } from "vitest";
import {
  checkoutRateLimit,
  createRateLimiter,
  leadRateLimit,
  loginRateLimit,
  resetRateLimitsForTests,
} from "@/lib/security/rate-limit";

describe("shared rate limiters", () => {
  it("blocks bursts then recovers after the window", () => {
    let now = 0;
    const limiter = createRateLimiter(2, 1_000, () => now);
    expect(limiter.consume("a").ok).toBe(true);
    expect(limiter.consume("a").ok).toBe(true);
    expect(limiter.consume("a").ok).toBe(false);
    now = 1_000;
    expect(limiter.consume("a").ok).toBe(true);
  });

  it("exposes checkout / lead / login limiters for public surfaces", () => {
    resetRateLimitsForTests();
    expect(checkoutRateLimit.consume("ip-1").ok).toBe(true);
    expect(leadRateLimit.consume("ip-1").ok).toBe(true);
    expect(loginRateLimit.consume("ip-1").ok).toBe(true);
  });
});
