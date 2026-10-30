import assert from "node:assert/strict";
import test from "node:test";
import { can } from "./rbac";

test("splits staff permissions", () => {
  assert.equal(can("ADMIN", "users.manage"), true);
  assert.equal(can("MANAGER", "orders.manage"), true);
  assert.equal(can("MANAGER", "users.manage"), false);
  assert.equal(can("CONTENT", "articles.write"), true);
  assert.equal(can("CONTENT", "products.price"), false);
  assert.equal(can("CUSTOMER", "orders.manage"), false);
});
