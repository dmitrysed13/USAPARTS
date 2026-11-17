import { describe, expect, it } from "vitest";
import { assertProductionEnv, getSiteUrl, parseServerEnv } from "@/lib/env";

describe("environment", () => {
  it("accepts an empty local environment", () => {
    expect(parseServerEnv({})).toEqual({});
    expect(getSiteUrl({})).toBe("http://localhost:3000");
  });

  it("rejects a malformed database URL", () => {
    expect(() => parseServerEnv({ DATABASE_URL: "localhost" })).toThrow();
  });

  it("accepts local postgres and redis URLs", () => {
    const parsed = parseServerEnv({
      DATABASE_URL:
        "postgresql://europart:europart@localhost:5432/europart?schema=public",
      REDIS_URL: "redis://localhost:6379",
    });
    expect(parsed.DATABASE_URL).toContain("postgresql://");
  });

  it("requires the production origin, database and auth secret together", () => {
    expect(() => assertProductionEnv({})).toThrow(/production/);
    expect(() =>
      assertProductionEnv({
        NODE_ENV: "production",
        NEXT_PUBLIC_SITE_URL: "https://europart.by",
        DATABASE_URL: "postgresql://user:pass@db:5432/europart",
        BETTER_AUTH_SECRET: "this-is-a-test-secret-with-32-chars",
      }),
    ).not.toThrow();
  });
});
