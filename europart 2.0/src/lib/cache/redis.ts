import Redis from "ioredis";

export type DependencyStatus = "not_configured" | "up" | "down";

export interface KeyValueCache {
  get(key: string): Promise<string | null>;
  set(key: string, value: string, ttlSeconds: number): Promise<void>;
}

export function cacheKey(namespace: string, ...parts: string[]): string {
  return ["europart", namespace, ...parts.map((part) => part.trim())].join(":");
}

export class RedisCache implements KeyValueCache {
  constructor(private readonly redis: Redis) {}

  get(key: string): Promise<string | null> {
    return this.redis.get(key);
  }

  async set(key: string, value: string, ttlSeconds: number): Promise<void> {
    await this.redis.set(key, value, "EX", ttlSeconds);
  }
}

export function createRedisClient(url: string): Redis {
  return new Redis(url, {
    lazyConnect: true,
    connectTimeout: 1500,
    maxRetriesPerRequest: 1,
    enableOfflineQueue: false,
  });
}

export async function pingRedis(url: string | undefined): Promise<DependencyStatus> {
  if (!url) {
    return "not_configured";
  }

  const client = createRedisClient(url);
  try {
    await client.connect();
    const response = await client.ping();
    return response === "PONG" ? "up" : "down";
  } catch {
    return "down";
  } finally {
    client.disconnect();
  }
}
