import { describe, expect, it } from "vitest";
import { buildSecurityHeaders } from "@/lib/security/headers";
import { resolveCanonicalRedirect } from "@/lib/security/canonical-host";
import { readJsonBody, CHECKOUT_BODY_MAX } from "@/lib/security/request-body";

describe("security headers", () => {
  it("sets baseline headers and HSTS for https site URL", () => {
    const headers = buildSecurityHeaders({ siteUrl: "https://europart.by" });
    expect(headers["X-Content-Type-Options"]).toBe("nosniff");
    expect(headers["X-Frame-Options"]).toBe("SAMEORIGIN");
    expect(headers["Strict-Transport-Security"]).toContain("max-age=");
  });

  it("omits HSTS for http local origin", () => {
    const headers = buildSecurityHeaders({ siteUrl: "http://localhost:3000" });
    expect(headers["Strict-Transport-Security"]).toBeUndefined();
  });
});

describe("canonical host redirect", () => {
  it("skips redirects outside production", () => {
    const result = resolveCanonicalRedirect({
      siteUrl: "https://europart.by",
      nodeEnv: "development",
      requestUrl: new URL("http://localhost:3000/catalog"),
      forwardedProto: "http",
      forwardedHost: "localhost:3000",
      hostHeader: "localhost:3000",
    });
    expect(result.redirect).toBe(false);
  });

  it("redirects http → https and wrong host to SITE_URL in production", () => {
    const https = resolveCanonicalRedirect({
      siteUrl: "https://europart.by",
      nodeEnv: "production",
      requestUrl: new URL("http://europart.by/search"),
      forwardedProto: "http",
      forwardedHost: "europart.by",
      hostHeader: "europart.by",
    });
    expect(https.redirect).toBe(true);
    if (https.redirect) {
      expect(https.url.protocol).toBe("https:");
      expect(https.url.host).toBe("europart.by");
      expect(https.url.pathname).toBe("/search");
    }

    const www = resolveCanonicalRedirect({
      siteUrl: "https://europart.by",
      nodeEnv: "production",
      requestUrl: new URL("https://www.europart.by/cart"),
      forwardedProto: "https",
      forwardedHost: "www.europart.by",
      hostHeader: "www.europart.by",
    });
    expect(www.redirect).toBe(true);
    if (www.redirect) {
      expect(www.url.host).toBe("europart.by");
      expect(www.url.pathname).toBe("/cart");
    }
  });
});

describe("JSON body size cap", () => {
  it("rejects oversized bodies before parse", async () => {
    const big = "x".repeat(CHECKOUT_BODY_MAX + 1);
    const result = await readJsonBody(
      new Request("http://localhost/api/checkout", {
        method: "POST",
        body: big,
      }),
      CHECKOUT_BODY_MAX,
    );
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.status).toBe(413);
    }
  });

  it("parses valid JSON under the limit", async () => {
    const result = await readJsonBody(
      new Request("http://localhost/api/leads", {
        method: "POST",
        body: JSON.stringify({ name: "Test" }),
      }),
      1000,
    );
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.value).toEqual({ name: "Test" });
    }
  });
});
