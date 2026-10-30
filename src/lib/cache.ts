import Redis from "ioredis";
import { logError } from "@/lib/logger";

type Entry = { exp: number; value: string };

const memory = new Map<string, Entry>();
let client: Redis | null = null;
let connectPromise: Promise<void> | null = null;
let retryAt = 0;

function redis() {
  if (!process.env.REDIS_URL || Date.now() < retryAt) return null;
  if (client && (client.status === "end" || client.status === "close")) {
    client.removeAllListeners();
    client.disconnect();
    client = null;
  }
  if (!client) {
    client = new Redis(process.env.REDIS_URL, {
      maxRetriesPerRequest: 1,
      enableOfflineQueue: false,
      connectTimeout: 800,
      lazyConnect: true,
      retryStrategy: () => null,
    });
    client.on("error", (error) => logError("redis", error));
  }
  return client;
}

async function ensureReady(r: Redis) {
  if (r.status === "ready") return;
  if (r.status === "connecting" || r.status === "connect" || r.status === "reconnecting") {
    await new Promise<void>((resolve, reject) => {
      const ok = () => {
        cleanup();
        resolve();
      };
      const fail = (error: Error) => {
        cleanup();
        reject(error);
      };
      const cleanup = () => {
        r.off("ready", ok);
        r.off("error", fail);
      };
      r.once("ready", ok);
      r.once("error", fail);
    });
    return;
  }
  if (!connectPromise) {
    connectPromise = r.connect().then(() => undefined).finally(() => {
      connectPromise = null;
    });
  }
  await connectPromise;
}

function coolDown(scope: string, error: unknown) {
  retryAt = Date.now() + 15_000;
  logError(scope, error);
}

async function readRaw(key: string) {
  const hit = memory.get(key);
  if (hit && hit.exp > Date.now()) return hit.value;
  const r = redis();
  if (!r) return null;
  try {
    await ensureReady(r);
    const raw = await r.get(key);
    if (raw) memory.set(key, { exp: Date.now() + 5_000, value: raw });
    return raw;
  } catch (error) {
    coolDown("redis.get", error);
    return null;
  }
}

async function writeRaw(key: string, raw: string, ttlSeconds: number) {
  memory.set(key, { exp: Date.now() + ttlSeconds * 1000, value: raw });
  const r = redis();
  if (!r) return;
  try {
    await ensureReady(r);
    await r.set(key, raw, "EX", ttlSeconds);
  } catch (error) {
    coolDown("redis.set", error);
  }
}

export async function cacheGet<T>(key: string): Promise<T | null> {
  const raw = await readRaw(key);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

export async function cacheSet(key: string, value: unknown, ttlSeconds: number) {
  await writeRaw(key, JSON.stringify(value), ttlSeconds);
}

let versionMemo: { v: string; exp: number } | null = null;

export async function cacheVersion() {
  if (versionMemo && versionMemo.exp > Date.now()) return versionMemo.v;
  const v = (await cacheGet<string>("cache:ver")) ?? "1";
  versionMemo = { v, exp: Date.now() + 2_000 };
  return v;
}

export async function bumpCache() {
  versionMemo = null;
  await cacheSet("cache:ver", String(Date.now()), 60 * 60 * 24 * 30);
}

export async function cacheWrap<T>(key: string, ttl: number, fn: () => Promise<T>): Promise<T> {
  const version = await cacheVersion();
  const full = `usaparts:${version}:${key}`;
  const hit = await cacheGet<{ data: T }>(full);
  if (hit) return hit.data;
  const data = await fn();
  await cacheSet(full, { data }, ttl);
  return data;
}

export async function redisStatus(): Promise<"up" | "down" | "unconfigured"> {
  if (!process.env.REDIS_URL) return "unconfigured";
  const r = redis();
  if (!r) return "down";
  try {
    await ensureReady(r);
    const pong = await r.ping();
    return pong === "PONG" ? "up" : "down";
  } catch {
    return "down";
  }
}
