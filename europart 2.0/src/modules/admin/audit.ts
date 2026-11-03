import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";

type AuditInput = {
  action: string;
  entityType: string;
  entityId: string;
  summary: string;
  changes?: Prisma.InputJsonValue;
};

export async function writeAudit(
  input: AuditInput,
  tx: Prisma.TransactionClient | null = null,
) {
  const client = tx ?? getPrismaClient();
  await client.auditLog.create({
    data: {
      actor: "admin",
      action: input.action,
      entityType: input.entityType,
      entityId: input.entityId,
      summary: input.summary,
      changes: input.changes,
    },
  });
}

export async function listAudit(limit = 100) {
  return getPrismaClient().auditLog.findMany({
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}
