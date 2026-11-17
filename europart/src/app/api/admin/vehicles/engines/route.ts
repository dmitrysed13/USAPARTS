import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { createVehicleEngine, vehicleAdminError } from "@/modules/fitment/vehicles";

export async function POST(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "vehicles");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const engine = await createVehicleEngine({
      modificationId: body.modificationId,
      name: body.name,
      slug: body.slug,
      code: body.code,
      fuelType: body.fuelType,
      displacement: body.displacement,
      power: body.power,
    });
    return adminJson({ id: engine.id, slug: engine.slug }, 201);
  } catch (error) {
    try {
      return fail(request, "/api/admin/vehicles/engines", vehicleAdminError(error), 400);
    } catch (unknownError) {
      return fail(
        request,
        "/api/admin/vehicles/engines",
        publicError(unknownError, "Не сохранено."),
        400,
      );
    }
  }
}
