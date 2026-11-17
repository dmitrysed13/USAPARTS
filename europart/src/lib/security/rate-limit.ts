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
          Math.ceil((recent[0]! + windowMs - current) / 1000),
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

/** Catalog / OEM search API. */
export const searchRateLimit = createRateLimiter(30, 60_000);
/** Public VIN lead form. */
export const vinRateLimit = createRateLimiter(5, 10 * 60_000);
/** Manager checkout create. */
export const checkoutRateLimit = createRateLimiter(10, 60_000);
/** Generic leads (price / contact / B2B). */
export const leadRateLimit = createRateLimiter(10, 60_000);
/** Cart mutations. */
export const cartRateLimit = createRateLimiter(60, 60_000);
/** Admin login brute-force shield (per IP). */
export const loginRateLimit = createRateLimiter(8, 15 * 60_000);
/** Payment webhook flood shield (signature still required). */
export const webhookRateLimit = createRateLimiter(60, 60_000);

export function resetRateLimitsForTests(): void {
  searchRateLimit.reset();
  vinRateLimit.reset();
  checkoutRateLimit.reset();
  leadRateLimit.reset();
  cartRateLimit.reset();
  loginRateLimit.reset();
  webhookRateLimit.reset();
}

export function rateLimitResponse(
  retryAfterSeconds: number,
  message = "Слишком много запросов. Повторите позже.",
): Response {
  return Response.json(
    { message },
    {
      status: 429,
      headers: {
        "cache-control": "no-store",
        "retry-after": String(retryAfterSeconds),
      },
    },
  );
}
