import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { createVehicleGeneration, vehicleAdminError } from "@/modules/fitment/vehicles";

export async function POST(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "vehicles");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const generation = await createVehicleGeneration({
      modelId: body.modelId,
      name: body.name,
      slug: body.slug,
      startYear: body.startYear,
      endYear: body.endYear,
    });
    return adminJson({ id: generation.id, slug: generation.slug }, 201);
  } catch (error) {
    try {
      return fail(request, "/api/admin/vehicles/generations", vehicleAdminError(error), 400);
    } catch (unknownError) {
      return fail(
        request,
        "/api/admin/vehicles/generations",
        publicError(unknownError, "Не сохранено."),
        400,
      );
    }
  }
}
