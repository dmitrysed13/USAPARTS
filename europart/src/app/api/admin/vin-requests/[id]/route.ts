import { connection } from "next/server";
import type { VinRequestStatus } from "@/generated/prisma/client";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";
import {
  appendVinRequestHistory,
  listVinRequestHistory,
  VinHistoryError,
} from "@/modules/vin/history";

const statuses = new Set<VinRequestStatus>([
  "NEW",
  "IN_PROGRESS",
  "ANSWERED",
  "CLOSED",
  "CANCELLED",
]);

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection();
  const gate = await requireAdminApiAsync(request, "vin");
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await context.params;
  try {
    const row = await withDatabase(() =>
      getPrismaClient().vinRequest.findUnique({
        where: { id },
        select: {
          id: true,
          vin: true,
          vinIsStandard: true,
          status: true,
          customerName: true,
          phone: true,
          email: true,
          comment: true,
          partName: true,
          partNumber: true,
          vehicleBrand: true,
          vehicleModel: true,
          vehicleYear: true,
          engine: true,
          createdAt: true,
          updatedAt: true,
        },
      }),
    );
    if (!row) {
      return adminJson({ message: "Не найдено." }, 404);
    }
    const history = await listVinRequestHistory(id);
    return adminJson({ request: row, history });
  } catch (error) {
    return fail(
      request,
      `/api/admin/vin-requests/${id}`,
      publicError(error, "Не удалось загрузить заявку."),
      500,
    );
  }
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection();
  const gate = await requireAdminApiAsync(request, "vin");
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const toStatus = String(body.status ?? "") as VinRequestStatus;
    if (!statuses.has(toStatus)) {
      return fail(request, `/api/admin/vin-requests/${id}`, "Некорректный статус.", 400);
    }
    const history = await appendVinRequestHistory({
      vinRequestId: id,
      toStatus,
      comment: body.comment ? String(body.comment) : null,
      actor: body.actor ? String(body.actor) : "admin",
    });
    return adminJson({ historyId: history.id, status: toStatus });
  } catch (error) {
    if (error instanceof VinHistoryError) {
      return fail(request, `/api/admin/vin-requests/${id}`, error.message, 400);
    }
    return fail(
      request,
      `/api/admin/vin-requests/${id}`,
      publicError(error, "Не сохранено."),
      400,
    );
  }
}
