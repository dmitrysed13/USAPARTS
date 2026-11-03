type RateLimitResult = { ok: true } | { ok: false; retryAfterSeconds: number };

export function createRateLimiter(
  limit: number,
  windowMs: number,
  now: () => number = Date.now,
) {
  const buckets = new Map<string, number[]>();

  return {
    consume(key: string): RateLimitResult {
      const current = now();
      const recent = (buckets.get(key) ?? []).filter(
        (timestamp) => current - timestamp < windowMs,
      );
      if (recent.length >= limit) {
        const retryAfterSeconds = Math.max(
          1,
          Math.ceil((recent[0] + windowMs - current) / 1000),
        );
        buckets.set(key, recent);
        return { ok: false, retryAfterSeconds };
      }
      recent.push(current);
      buckets.set(key, recent);
      return { ok: true };
    },
    reset(): void {
      buckets.clear();
    },
  };
}

export const searchRateLimit = createRateLimiter(30, 60_000);
export const vinRateLimit = createRateLimiter(5, 10 * 60_000);
export const adminLoginRateLimit = createRateLimiter(8, 10 * 60_000);

export function resetRateLimitsForTests(): void {
  searchRateLimit.reset();
  vinRateLimit.reset();
  adminLoginRateLimit.reset();
}
