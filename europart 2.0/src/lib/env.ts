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

/**
 * Called by the production process once authentication and the public origin are required.
 * Importing the app does not call this, so a local build can run without secrets.
 */
export function assertProductionEnv(source: EnvSource = process.env): void {
  const siteUrl = source.NEXT_PUBLIC_SITE_URL;
  const secret = source.BETTER_AUTH_SECRET;
  const databaseUrl = source.DATABASE_URL;
  if (!siteUrl || !databaseUrl || !secret || secret.length < 32) {
    throw new Error(
      "В production нужны NEXT_PUBLIC_SITE_URL, DATABASE_URL и BETTER_AUTH_SECRET длиной от 32 символов.",
    );
  }
  publicEnvSchema.parse({ NEXT_PUBLIC_SITE_URL: siteUrl });
  serverEnvSchema.parse({
    DATABASE_URL: databaseUrl,
    BETTER_AUTH_SECRET: secret,
    BETTER_AUTH_URL: emptyToUndefined(source.BETTER_AUTH_URL),
    REDIS_URL: emptyToUndefined(source.REDIS_URL),
  });
}

function emptyToUndefined(value: string | undefined): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed : undefined;
}
