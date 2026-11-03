import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";

export type DependencyStatus = "not_configured" | "up" | "down";

export async function getDatabaseStatus(): Promise<DependencyStatus> {
  if (!process.env.DATABASE_URL) {
    return "not_configured";
  }

  try {
    const prisma = getPrismaClient();
    await prisma.$queryRaw`SELECT 1`;
    return "up";
  } catch {
    return "down";
  }
}
