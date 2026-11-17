"use server";

import { writeSelectedVehicle } from "@/modules/fitment/vehicle-http";

export async function clearSelectedVehicleAction() {
  await writeSelectedVehicle(null);
}
