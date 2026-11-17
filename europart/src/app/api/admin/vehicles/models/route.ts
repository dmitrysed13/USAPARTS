import { connection } from "next/server";
import { requireAdminApi } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { createVehicleModel, vehicleAdminError } from "@/modules/fitment/vehicles";

export async function POST(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const model = await createVehicleModel({
      brandId: body.brandId,
      name: body.name,
      slug: body.slug,
      startYear: body.startYear,
      endYear: body.endYear,
    });
    return adminJson({ id: model.id, slug: model.slug }, 201);
  } catch (error) {
    try {
      return fail(request, "/api/admin/vehicles/models", vehicleAdminError(error), 400);
    } catch (unknownError) {
      return fail(
        request,
        "/api/admin/vehicles/models",
        publicError(unknownError, "Не сохранено."),
        400,
      );
    }
  }
}
