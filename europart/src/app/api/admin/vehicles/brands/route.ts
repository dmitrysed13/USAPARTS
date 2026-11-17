import { connection } from "next/server";
import { requireAdminApi } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { listVehicleBrands } from "@/modules/fitment/repository";
import { createVehicleBrand, vehicleAdminError } from "@/modules/fitment/vehicles";

export async function GET(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  const brands = await listVehicleBrands();
  return adminJson({ brands });
}

export async function POST(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const brand = await createVehicleBrand({
      name: body.name,
      slug: body.slug,
      description: body.description,
      sortOrder: body.sortOrder,
    });
    return adminJson({ id: brand.id, slug: brand.slug }, 201);
  } catch (error) {
    try {
      return fail(request, "/api/admin/vehicles/brands", vehicleAdminError(error), 400);
    } catch (unknownError) {
      return fail(
        request,
        "/api/admin/vehicles/brands",
        publicError(unknownError, "Не сохранено."),
        400,
      );
    }
  }
}
