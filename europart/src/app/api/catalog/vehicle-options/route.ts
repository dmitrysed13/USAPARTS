import { connection } from "next/server";
import { DataUnavailableError } from "@/lib/db/errors";
import { listVehicleOptionLevel } from "@/modules/fitment/vehicle-options";

function one(value: string | null): string | undefined {
  const trimmed = value?.trim();
  return trimmed ? trimmed.slice(0, 80) : undefined;
}

export async function GET(request: Request) {
  await connection();
  const url = new URL(request.url);
  try {
    const payload = await listVehicleOptionLevel({
      brand: one(url.searchParams.get("brand")),
      model: one(url.searchParams.get("model")),
      generation: one(url.searchParams.get("generation")),
      modification: one(url.searchParams.get("modification")),
      year: one(url.searchParams.get("year")),
    });
    return Response.json(payload, { headers: { "cache-control": "no-store" } });
  } catch (error) {
    if (error instanceof DataUnavailableError) {
      return Response.json(
        { message: "Справочник автомобилей временно недоступен." },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }
    throw error;
  }
}
