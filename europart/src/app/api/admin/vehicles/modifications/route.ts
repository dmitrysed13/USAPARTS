import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { createVehicleModification, vehicleAdminError } from "@/modules/fitment/vehicles";

export async function POST(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "vehicles");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const modification = await createVehicleModification({
      generationId: body.generationId,
      name: body.name,
      slug: body.slug,
      yearFrom: body.yearFrom,
      yearTo: body.yearTo,
      engine: body.engine,
      engineCode: body.engineCode,
      fuelType: body.fuelType,
      displacement: body.displacement,
      power: body.power,
      bodyType: body.bodyType,
      transmission: body.transmission,
      driveType: body.driveType,
    });
    return adminJson({ id: modification.id, slug: modification.slug }, 201);
  } catch (error) {
    try {
      return fail(
        request,
        "/api/admin/vehicles/modifications",
        vehicleAdminError(error),
        400,
      );
    } catch (unknownError) {
      return fail(
        request,
        "/api/admin/vehicles/modifications",
        publicError(unknownError, "Не сохранено."),
        400,
      );
    }
  }
}
