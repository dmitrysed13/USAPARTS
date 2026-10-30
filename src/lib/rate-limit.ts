import { cacheGet, cacheSet } from "@/lib/cache";

export async function rateLimit(key: string, limit: number, windowSec: number) {
  const bucket = `rl:${key}`;
  const current = (await cacheGet<number>(bucket)) ?? 0;
  if (current >= limit) return { ok: false as const, remaining: 0 };
  await cacheSet(bucket, current + 1, windowSec);
  return { ok: true as const, remaining: limit - current - 1 };
}
