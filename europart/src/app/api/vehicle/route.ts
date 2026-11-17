import { connection } from "next/server";
import {
  normalizeSelectedVehicle,
  vehicleHref,
  type SelectedVehicle,
} from "@/modules/fitment/vehicle-cookie";
import { readSelectedVehicle, writeSelectedVehicle } from "@/modules/fitment/vehicle-http";

export async function GET() {
  await connection();
  const vehicle = await readSelectedVehicle();
  return Response.json(
    {
      vehicle,
      href: vehicle ? vehicleHref(vehicle) : null,
    },
    { headers: { "cache-control": "no-store" } },
  );
}

export async function PUT(request: Request) {
  await connection();
  try {
    const body = (await request.json()) as Partial<SelectedVehicle>;
    const vehicle = normalizeSelectedVehicle(body);
    if (!vehicle) {
      return Response.json(
        { message: "Укажите хотя бы марку автомобиля." },
        { status: 400, headers: { "cache-control": "no-store" } },
      );
    }
    const result = await writeSelectedVehicle(vehicle);
    if (!result.ok) {
      return Response.json(
        { message: result.message },
        { status: 503, headers: { "cache-control": "no-store" } },
      );
    }
    return Response.json(
      { vehicle, href: vehicleHref(vehicle) },
      { headers: { "cache-control": "no-store" } },
    );
  } catch {
    return Response.json(
      { message: "Некорректный JSON." },
      { status: 400, headers: { "cache-control": "no-store" } },
    );
  }
}

export async function DELETE() {
  await connection();
  const result = await writeSelectedVehicle(null);
  if (!result.ok) {
    return Response.json(
      { message: result.message },
      { status: 503, headers: { "cache-control": "no-store" } },
    );
  }
  return Response.json({ vehicle: null }, { headers: { "cache-control": "no-store" } });
}
