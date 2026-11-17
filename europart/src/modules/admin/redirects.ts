import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

function normalizePath(value: string): string {
  const trimmed = value.trim();
  if (!trimmed.startsWith("/")) {
    throw new Error("Путь должен начинаться с /.");
  }
  return trimmed.slice(0, 500);
}

export async function listRedirectRules() {
  return withDatabase(() =>
    getPrismaClient().redirectRule.findMany({
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
  );
}

export async function createRedirectRule(input: {
  fromPath: string;
  toPath: string;
  note?: string;
  isActive?: boolean;
}) {
  const fromPath = normalizePath(input.fromPath);
  const toPath = normalizePath(input.toPath);
  return withDatabase(() =>
    getPrismaClient().redirectRule.create({
      data: {
        fromPath,
        toPath,
        note: input.note?.trim().slice(0, 500) || null,
        isActive: input.isActive ?? true,
      },
    }),
  );
}
