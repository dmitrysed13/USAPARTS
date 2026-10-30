import assert from "node:assert/strict";
import test from "node:test";
import { decodeCart, encodeCart } from "./cart";

test("roundtrips a signed cart", () => {
  const encoded = encodeCart([{ productId: "p1", quantity: 2 }], "secret");
  assert.deepEqual(decodeCart(encoded, "secret"), [{ productId: "p1", quantity: 2 }]);
});

test("rejects a tampered cart", () => {
  const encoded = encodeCart([{ productId: "p1", quantity: 2 }], "secret");
  assert.deepEqual(decodeCart(encoded.slice(0, -2) + "aa", "secret"), []);
});
