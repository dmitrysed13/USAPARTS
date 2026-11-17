import { describe, expect, it } from "vitest";
import {
  decodeAdminSession,
  encodeAdminSession,
} from "@/modules/admin/session";
import { roleHasPermission } from "@/modules/admin/roles";

const secret = "test-admin-session-16";

describe("admin session + RBAC", () => {
  it("round-trips a signed session", () => {
    const encoded = encodeAdminSession(
      {
        userId: "u1",
        email: "admin@example.com",
        name: "Admin",
        role: "MANAGER",
      },
      secret,
    );
    const decoded = decodeAdminSession(encoded, secret);
    expect(decoded?.role).toBe("MANAGER");
    expect(decoded?.email).toBe("admin@example.com");
  });

  it("rejects tampered sessions", () => {
    const encoded = encodeAdminSession(
      {
        userId: "u1",
        email: "admin@example.com",
        name: "Admin",
        role: "ADMIN",
      },
      secret,
    );
    expect(decodeAdminSession(`${encoded}x`, secret)).toBeNull();
  });

  it("enforces role permissions", () => {
    expect(roleHasPermission("SEO_MANAGER", "seo")).toBe(true);
    expect(roleHasPermission("SEO_MANAGER", "orders")).toBe(false);
    expect(roleHasPermission("WAREHOUSE_MANAGER", "import")).toBe(true);
    expect(roleHasPermission("B2B_MANAGER", "warehouses")).toBe(false);
    expect(roleHasPermission("SUPER_ADMIN", "staff")).toBe(true);
  });
});
