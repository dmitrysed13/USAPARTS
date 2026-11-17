import "server-only";

import { Prisma, type VinRequestStatus } from "@/generated/prisma/client";
import { withDatabase } from "@/lib/db/errors";
import { getPrismaClient } from "@/lib/db/prisma";

const transitions: Record<VinRequestStatus, VinRequestStatus[]> = {
  NEW: ["IN_PROGRESS", "CANCELLED"],
  IN_PROGRESS: ["ANSWERED", "CLOSED", "CANCELLED"],
  ANSWERED: ["CLOSED", "IN_PROGRESS"],
  CLOSED: [],
  CANCELLED: [],
};

export class VinHistoryError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VinHistoryError";
  }
}

export async function listVinRequestHistory(vinRequestId: string) {
  return withDatabase(() =>
    getPrismaClient().vinRequestHistory.findMany({
      where: { vinRequestId },
      orderBy: { createdAt: "asc" },
      select: {
        id: true,
        fromStatus: true,
        toStatus: true,
        comment: true,
        actor: true,
        createdAt: true,
      },
    }),
  );
}

export async function appendVinRequestHistory(input: {
  vinRequestId: string;
  toStatus: VinRequestStatus;
  comment?: string | null;
  actor: string;
}) {
  return withDatabase(async () => {
    const prisma = getPrismaClient();
    const current = await prisma.vinRequest.findUnique({
      where: { id: input.vinRequestId },
      select: { id: true, status: true },
    });
    if (!current) {
      throw new VinHistoryError("VIN-заявка не найдена.");
    }
    if (input.toStatus !== current.status) {
      const allowed = transitions[current.status] ?? [];
      if (!allowed.includes(input.toStatus)) {
        throw new VinHistoryError(
          `Переход ${current.status} → ${input.toStatus} не допускается.`,
        );
      }
    }
    try {
      const [history] = await prisma.$transaction([
        prisma.vinRequestHistory.create({
          data: {
            vinRequestId: current.id,
            fromStatus: current.status,
            toStatus: input.toStatus,
            comment: input.comment?.trim() || null,
            actor: input.actor.slice(0, 80),
          },
        }),
        prisma.vinRequest.update({
          where: { id: current.id },
          data: { status: input.toStatus },
        }),
      ]);
      return history;
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        throw new VinHistoryError("Не удалось обновить историю VIN-заявки.");
      }
      throw error;
    }
  });
}
