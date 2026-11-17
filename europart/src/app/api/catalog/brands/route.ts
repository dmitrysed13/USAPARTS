import { connection } from "next/server";
import { DataUnavailableError } from "@/lib/db/errors";
import { listVehicleBrands } from "@/modules/fitment/repository";

export async function GET() {
  await connection();
  try {
    const brands = await listVehicleBrands();
    return Response.json(
      {
        brands: brands.map(({ name, slug, logo, description }) => ({
          name,
          slug,
          logo,
          description,
        })),
      },
      { headers: { "cache-control": "no-store" } },
    );
  } catch (error) {
    if (error instanceof DataUnavailableError) {
      return Response.json(
        { message: "Список марок временно недоступен." },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }
    throw error;
  }
}
