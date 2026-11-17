import { z } from "zod";

const optionalUrl = z.url().optional();

export const serverEnvSchema = z.object({
  DATABASE_URL: optionalUrl,
  REDIS_URL: optionalUrl,
  BETTER_AUTH_SECRET: z.string().min(32).optional(),
  BETTER_AUTH_URL: optionalUrl,
});

export const publicEnvSchema = z.object({
  NEXT_PUBLIC_SITE_URL: z.url().optional(),
});

export type ServerEnv = z.infer<typeof serverEnvSchema>;

type EnvSource = Record<string, string | undefined>;

export function parseServerEnv(source: EnvSource = process.env): ServerEnv {
  return serverEnvSchema.parse({
    DATABASE_URL: emptyToUndefined(source.DATABASE_URL),
    REDIS_URL: emptyToUndefined(source.REDIS_URL),
    BETTER_AUTH_SECRET: emptyToUndefined(source.BETTER_AUTH_SECRET),
    BETTER_AUTH_URL: emptyToUndefined(source.BETTER_AUTH_URL),
  });
}

export function getSiteUrl(source: EnvSource = process.env): string {
  const parsed = publicEnvSchema.parse({
    NEXT_PUBLIC_SITE_URL: emptyToUndefined(source.NEXT_PUBLIC_SITE_URL),
  });
  return (parsed.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000").replace(/\/$/, "");
}

function hasSessionSecret(source: EnvSource): boolean {
  const adminSession = source.ADMIN_SESSION_SECRET?.trim();
  if (adminSession && adminSession.length >= 16) {
    return true;
  }
  const adminToken = source.ADMIN_API_TOKEN?.trim();
  if (adminToken && adminToken.length >= 16) {
    return true;
  }
  const auth = source.BETTER_AUTH_SECRET?.trim();
  return Boolean(auth && auth.length >= 32);
}

function hasCartSecret(source: EnvSource): boolean {
  const cart = source.CART_SECRET?.trim();
  if (cart && cart.length >= 16) {
    return true;
  }
  const auth = source.BETTER_AUTH_SECRET?.trim();
  return Boolean(auth && auth.length >= 32);
}

/**
 * Called by the production process once authentication and the public origin are required.
 * Importing the app / `next build` does not call this, so a local build can run without secrets.
 *
 * Prod example origin: NEXT_PUBLIC_SITE_URL=https://europart.by
 */
export function assertProductionEnv(source: EnvSource = process.env): void {
  const siteUrl = source.NEXT_PUBLIC_SITE_URL?.trim();
  const databaseUrl = source.DATABASE_URL?.trim();
  if (!siteUrl || !databaseUrl) {
    throw new Error(
      "В production нужны NEXT_PUBLIC_SITE_URL и DATABASE_URL (пример origin: https://europart.by).",
    );
  }
  if (!hasSessionSecret(source)) {
    throw new Error(
      "В production нужен секрет админки: ADMIN_SESSION_SECRET (≥16), ADMIN_API_TOKEN (≥16) или BETTER_AUTH_SECRET (≥32).",
    );
  }
  if (!hasCartSecret(source)) {
    throw new Error(
      "В production нужен CART_SECRET (≥16) или BETTER_AUTH_SECRET (≥32) для подписи корзины.",
    );
  }
  publicEnvSchema.parse({ NEXT_PUBLIC_SITE_URL: siteUrl });
  serverEnvSchema.parse({
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: emptyToUndefined(source.BETTER_AUTH_SECRET),
    BETTER_AUTH_URL: emptyToUndefined(source.BETTER_AUTH_URL),
    REDIS_URL: emptyToUndefined(source.REDIS_URL),
  });
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
