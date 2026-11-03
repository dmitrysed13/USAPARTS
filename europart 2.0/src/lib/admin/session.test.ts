import { describe, expect, it } from "vitest";
import {
  ADMIN_SESSION_MS,
  isSameOrigin,
  passwordsMatch,
  signAdminToken,
  verifyAdminToken,
} from "@/lib/admin/session";

describe("admin session", () => {
  it("accepts a fresh token and rejects a changed one", () => {
    const now = Date.parse("2026-11-03T12:00:00Z");
    const token = signAdminToken("stage3-admin-password", now + ADMIN_SESSION_MS);
    expect(verifyAdminToken(token, "stage3-admin-password", now)).toBe(true);
    expect(verifyAdminToken(token, "stage3-admin-password", now + ADMIN_SESSION_MS)).toBe(
      false,
    );
    expect(
      verifyAdminToken(`${now + 10}.` + "a".repeat(64), "stage3-admin-password", now),
    ).toBe(false);
    const [payload, signature] = token.split(".");
    expect(
      verifyAdminToken(
        `${Number(payload) + 1}.${signature}`,
        "stage3-admin-password",
        now,
      ),
    ).toBe(false);
  });

  it("accepts the browser host when the internal request URL differs", () => {
    const request = new Request("http://localhost:3000/api/admin/login", {
      headers: { origin: "http://127.0.0.1:3000", host: "127.0.0.1:3000" },
    });
    expect(isSameOrigin(request)).toBe(true);
    const foreign = new Request("http://127.0.0.1:3000/api/admin/login", {
      headers: { origin: "https://evil.example", host: "127.0.0.1:3000" },
    });
    expect(isSameOrigin(foreign)).toBe(false);
  });

  it("compares passwords by hash", () => {
    expect(passwordsMatch("stage3-admin-password", "stage3-admin-password")).toBe(true);
    expect(passwordsMatch("stage3-admin-password", "other-admin-password")).toBe(false);
  });
});
