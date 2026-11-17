import "server-only";

import {
  Prisma,
  type SupplierSyncKind,
  type SupplierSyncStatus,
} from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { IntegrationNotConfiguredError } from "@/modules/integrations/ports";

/**
 * SupplierAdapter — vendor-agnostic port for products / prices / stock sync.
 * Concrete HTTP adapters register later; business rules stay outside the adapter.
 */

export type SupplierProductHit = {
  externalId: string;
  article: string;
  name: string;
  oem?: string | null;
  brand?: string | null;
};

export type SupplierPriceHit = {
  externalId: string;
  purchasePrice: number;
  currency: string;
};

export type SupplierStockHit = {
  externalId: string;
  quantity: number;
  availability: "IN_STOCK" | "LOW_STOCK" | "ON_ORDER" | "OUT_OF_STOCK" | "UNKNOWN";
  leadTimeDays?: number | null;
};

export interface SupplierAdapter {
  readonly key: string;
  readonly supplierCode: string;
  getProducts(cursor?: string): Promise<{ items: SupplierProductHit[]; nextCursor?: string }>;
  getPrices(externalIds?: string[]): Promise<SupplierPriceHit[]>;
  getStock(externalIds?: string[]): Promise<SupplierStockHit[]>;
  sync(kind: SupplierSyncKind): Promise<{ read: number; written: number }>;
}

export class SupplierAdapterError extends Error {
  readonly retryable: boolean;

  constructor(message: string, retryable = false) {
    super(message);
    this.name = "SupplierAdapterError";
    this.retryable = retryable;
  }
}

type RateBucket = { tokens: number; updatedAt: number };

const buckets = new Map<string, RateBucket>();

/** Token-bucket rate limit shared in-process (Redis later). */
export function takeRateToken(
  key: string,
  limitPerMinute: number,
  now = Date.now(),
): boolean {
  if (limitPerMinute <= 0) {
    return false;
  }
  const refillPerMs = limitPerMinute / 60_000;
  const bucket = buckets.get(key) ?? { tokens: limitPerMinute, updatedAt: now };
  const elapsed = Math.max(0, now - bucket.updatedAt);
  bucket.tokens = Math.min(limitPerMinute, bucket.tokens + elapsed * refillPerMs);
  bucket.updatedAt = now;
  if (bucket.tokens < 1) {
    buckets.set(key, bucket);
    return false;
  }
  bucket.tokens -= 1;
  buckets.set(key, bucket);
  return true;
}

export function resetRateBuckets(): void {
  buckets.clear();
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  options: { attempts?: number; delayMs?: number; shouldRetry?: (error: unknown) => boolean } = {},
): Promise<T> {
  const attempts = options.attempts ?? 3;
  const delayMs = options.delayMs ?? 50;
  let lastError: unknown;
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      const retryable =
        options.shouldRetry?.(error) ??
        (error instanceof SupplierAdapterError && error.retryable);
      if (!retryable || attempt === attempts) {
        throw error;
      }
      await new Promise((resolve) => setTimeout(resolve, delayMs * attempt));
    }
  }
  throw lastError;
}

export const unconfiguredSupplierAdapter: SupplierAdapter = {
  key: "unconfigured",
  supplierCode: "none",
  getProducts() {
    return Promise.reject(new IntegrationNotConfiguredError("supplier-adapter"));
  },
  getPrices() {
    return Promise.reject(new IntegrationNotConfiguredError("supplier-adapter"));
  },
  getStock() {
    return Promise.reject(new IntegrationNotConfiguredError("supplier-adapter"));
  },
  sync() {
    return Promise.reject(new IntegrationNotConfiguredError("supplier-adapter"));
  },
};

export async function logSupplierSync(input: {
  supplierId: string;
  kind: SupplierSyncKind;
  status: SupplierSyncStatus;
  attempt?: number;
  itemsRead?: number;
  itemsWritten?: number;
  errorMessage?: string | null;
  detail?: Record<string, unknown> | null;
  startedAt?: Date;
  finishedAt?: Date | null;
}): Promise<{ id: string }> {
  const row = await getPrismaClient().supplierSyncLog.create({
    data: {
      supplierId: input.supplierId,
      kind: input.kind,
      status: input.status,
      attempt: input.attempt ?? 1,
      itemsRead: input.itemsRead ?? 0,
      itemsWritten: input.itemsWritten ?? 0,
      errorMessage: input.errorMessage ?? null,
      detail: input.detail
        ? (input.detail as Prisma.InputJsonValue)
        : undefined,
      startedAt: input.startedAt ?? new Date(),
      finishedAt: input.finishedAt ?? (input.status === "STARTED" ? null : new Date()),
    },
    select: { id: true },
  });
  return row;
}

/**
 * Resolve adapter for a supplier. Until a concrete HTTP adapter is registered,
 * returns the fail-closed stub (never invents products/prices/stock).
 */
export function resolveSupplierAdapter(supplierCode: string): SupplierAdapter {
  void supplierCode;
  // Concrete HTTP adapters register by supplier code in a later integration PR.
  return unconfiguredSupplierAdapter;
}

export async function runSupplierSync(input: {
  supplierId: string;
  kind: SupplierSyncKind;
  limitPerMinute?: number;
}): Promise<{ logId: string; status: SupplierSyncStatus }> {
  const prisma = getPrismaClient();
  const supplier = await prisma.supplier.findUnique({ where: { id: input.supplierId } });
  if (!supplier || !supplier.isActive) {
    throw new SupplierAdapterError("Поставщик не найден или отключён.");
  }
  if (!supplier.apiEnabled) {
    throw new SupplierAdapterError("API поставщика выключено.");
  }
  if (!takeRateToken(`supplier:${supplier.code}`, input.limitPerMinute ?? 30)) {
    throw new SupplierAdapterError("Превышен лимит запросов к API поставщика.", true);
  }

  const startedAt = new Date();
  const started = await logSupplierSync({
    supplierId: supplier.id,
    kind: input.kind,
    status: "STARTED",
    startedAt,
    finishedAt: null,
  });

  try {
    const adapter = resolveSupplierAdapter(supplier.code);
    const result = await withRetry(() => adapter.sync(input.kind), {
      attempts: 3,
      shouldRetry: (error) =>
        error instanceof SupplierAdapterError
          ? error.retryable
          : error instanceof IntegrationNotConfiguredError
            ? false
            : true,
    });
    await prisma.supplierSyncLog.update({
      where: { id: started.id },
      data: {
        status: "SUCCESS",
        itemsRead: result.read,
        itemsWritten: result.written,
        finishedAt: new Date(),
      },
    });
    return { logId: started.id, status: "SUCCESS" };
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Синхронизация поставщика не удалась.";
    await prisma.supplierSyncLog.update({
      where: { id: started.id },
      data: {
        status: "FAILED",
        errorMessage: message.slice(0, 1000),
        finishedAt: new Date(),
      },
    });
    throw error;
  }
}
