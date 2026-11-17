import { describe, expect, it, afterEach } from "vitest";
import { configuredAdminToken, requireAdminApi } from "@/modules/admin/guard";

const savedToken = process.env.ADMIN_API_TOKEN;
const savedSession = process.env.ADMIN_SESSION_SECRET;

afterEach(() => {
  if (savedToken === undefined) {
    delete process.env.ADMIN_API_TOKEN;
  } else {
    process.env.ADMIN_API_TOKEN = savedToken;
  }
  if (savedSession === undefined) {
    delete process.env.ADMIN_SESSION_SECRET;
  } else {
    process.env.ADMIN_SESSION_SECRET = savedSession;
  }
});

describe("admin API token gate", () => {
  it("rejects when ADMIN_API_TOKEN is missing", () => {
    delete process.env.ADMIN_API_TOKEN;
    delete process.env.ADMIN_SESSION_SECRET;
    expect(configuredAdminToken()).toBeNull();
    const gate = requireAdminApi(new Request("http://localhost/api/admin/orders"));
    expect(gate.ok).toBe(false);
  });

  it("accepts a timing-safe Bearer token match", () => {
    process.env.ADMIN_API_TOKEN = "local-dev-token-16+";
    const request = new Request("http://localhost/api/admin/orders", {
      headers: { Authorization: "Bearer local-dev-token-16+" },
    });
    const gate = requireAdminApi(request, "orders");
    expect(gate.ok).toBe(true);
    if (gate.ok) {
      expect(gate.via).toBe("token");
    }
  });

  it("rejects a wrong token", () => {
    process.env.ADMIN_API_TOKEN = "local-dev-token-16+";
    const request = new Request("http://localhost/api/admin/orders", {
      headers: { Authorization: "Bearer wrong-token-value!" },
    });
    const gate = requireAdminApi(request);
    expect(gate.ok).toBe(false);
  });
});
