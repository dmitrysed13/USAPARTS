import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export async function GET(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "vin");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const rows = await withDatabase(() =>
      getPrismaClient().vinRequest.findMany({
        orderBy: { createdAt: "desc" },
        take: 50,
        select: {
          id: true,
          vin: true,
          vinIsStandard: true,
          status: true,
          customerName: true,
          phone: true,
          email: true,
          partName: true,
          partNumber: true,
          vehicleBrand: true,
          vehicleModel: true,
          vehicleYear: true,
          comment: true,
          createdAt: true,
          _count: { select: { history: true } },
        },
      }),
    );
    return adminJson({ requests: rows });
  } catch (error) {
    return fail(
      request,
      "/api/admin/vin-requests",
      publicError(error, "Не удалось загрузить VIN-заявки."),
      500,
    );
  }
}
