import assert from "node:assert/strict";
import test from "node:test";
import { validateVin } from "./vin";

test("accepts a known valid VIN checksum", () => {
  const result = validateVin("1hgcm82633a004352");
  assert.equal(result.ok, true);
});

test("rejects the wrong check digit", () => {
  const result = validateVin("1HGCM82633A004353");
  assert.equal(result.ok, false);
});

test("rejects letters I O Q", () => {
  const result = validateVin("1HGCM82633A00435I");
  assert.equal(result.ok, false);
});
