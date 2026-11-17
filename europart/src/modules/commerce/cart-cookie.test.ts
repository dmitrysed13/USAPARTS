import { describe, expect, it } from "vitest";
import {
  decodeCart,
  encodeCart,
  normalizeLines,
  resolveCartSecret,
  setCartQuantity,
} from "@/modules/commerce/cart-cookie";

const secret = "test-cart-secret-16";

describe("cart cookie", () => {
  it("round-trips signed lines and merges quantities", () => {
    const encoded = encodeCart(
      [
        { offerId: "a", quantity: 1 },
        { offerId: "a", quantity: 2 },
        { offerId: "b", quantity: 1 },
      ],
      secret,
    );
    expect(decodeCart(encoded, secret)).toEqual([
      { offerId: "a", quantity: 3 },
      { offerId: "b", quantity: 1 },
    ]);
  });

  it("rejects tampered payloads", () => {
    const encoded = encodeCart([{ offerId: "a", quantity: 1 }], secret);
    expect(decodeCart(`${encoded}x`, secret)).toEqual([]);
  });

  it("removes a line when quantity is zero", () => {
    expect(
      setCartQuantity(
        [
          { offerId: "a", quantity: 2 },
          { offerId: "b", quantity: 1 },
        ],
        "a",
        0,
      ),
    ).toEqual([{ offerId: "b", quantity: 1 }]);
  });

  it("does not invent a production cart secret", () => {
    expect(resolveCartSecret({ NODE_ENV: "production" })).toBeNull();
    expect(normalizeLines([]).length).toBe(0);
  });
});
