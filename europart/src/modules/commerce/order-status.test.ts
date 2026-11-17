import { describe, expect, it } from "vitest";
import {
  assertOrderStatusTransition,
  canTransitionOrderStatus,
} from "@/modules/commerce/order-status";

describe("order status machine", () => {
  it("allows the manager happy path", () => {
    expect(canTransitionOrderStatus("NEW", "UNDER_REVIEW")).toBe(true);
    expect(canTransitionOrderStatus("UNDER_REVIEW", "CONFIRMED")).toBe(true);
    expect(canTransitionOrderStatus("CONFIRMED", "PROCESSING")).toBe(true);
    expect(canTransitionOrderStatus("PROCESSING", "SHIPPED")).toBe(true);
    expect(canTransitionOrderStatus("SHIPPED", "DELIVERED")).toBe(true);
  });

  it("blocks client-style jumps and cancelled reopen", () => {
    expect(canTransitionOrderStatus("NEW", "PAID")).toBe(false);
    expect(canTransitionOrderStatus("CANCELLED", "NEW")).toBe(false);
    expect(() => assertOrderStatusTransition("NEW", "DELIVERED")).toThrow(/нельзя/);
  });
});
