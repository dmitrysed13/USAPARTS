import { describe, expect, it } from "vitest";
import { assessVin } from "@/modules/vin/assess-vin";
import { vinRequestSchema } from "@/modules/vin/schema";
import { createRateLimiter } from "@/lib/security/rate-limit";

const valid = {
  vin: "WVWZZZ3CZWE123456",
  customerName: "Иван",
  phone: "+375291112233",
  email: "",
  consent: true,
  website: "",
};

describe("VIN request rules", () => {
  it("accepts a standard VIN and a short manual number with a notice", () => {
    const standard = assessVin(" wvwzzz3czwe123456 ");
    expect(standard.ok && standard.standard).toBe(true);
    const manual = assessVin("abc-123");
    expect(manual.ok).toBe(true);
    if (manual.ok) {
      expect(manual.standard).toBe(false);
      expect(manual.notice).toContain("не похож");
    }
  });

  it("rejects an empty VIN and a number with punctuation", () => {
    expect(assessVin(" ").ok).toBe(false);
    expect(assessVin("ABC$123456").ok).toBe(false);
  });

  it("requires a name, consent and a phone or email", () => {
    expect(vinRequestSchema.safeParse(valid).success).toBe(true);
    expect(vinRequestSchema.safeParse({ ...valid, customerName: "A" }).success).toBe(
      false,
    );
    expect(vinRequestSchema.safeParse({ ...valid, phone: "", email: "" }).success).toBe(
      false,
    );
    expect(vinRequestSchema.safeParse({ ...valid, consent: false }).success).toBe(false);
    expect(
      vinRequestSchema.safeParse({ ...valid, website: "https://spam.example" }).success,
    ).toBe(false);
  });

  it("limits repeated submissions", () => {
    let now = 0;
    const limiter = createRateLimiter(2, 1_000, () => now);
    expect(limiter.consume("ip").ok).toBe(true);
    expect(limiter.consume("ip").ok).toBe(true);
    const blocked = limiter.consume("ip");
    expect(blocked.ok).toBe(false);
    now = 1_000;
    expect(limiter.consume("ip").ok).toBe(true);
  });
});
