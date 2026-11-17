"use server";

import {
  normalizeSelectedVehicle,
  type SelectedVehicle,
} from "@/modules/fitment/vehicle-cookie";
import { writeSelectedVehicle } from "@/modules/fitment/vehicle-http";

export async function selectVehicleAction(input: Partial<SelectedVehicle>) {
  const vehicle = normalizeSelectedVehicle(input);
  if (!vehicle) {
    return { ok: false as const, message: "Некорректные данные автомобиля." };
  }
  return writeSelectedVehicle(vehicle);
}

function field(formData: FormData, key: string): string | undefined {
  const value = formData.get(key);
  return typeof value === "string" ? value : undefined;
}

export async function selectVehicleFromFormAction(formData: FormData) {
  await selectVehicleAction({
    brandSlug: field(formData, "brandSlug"),
    brandName: field(formData, "brandName"),
    modelSlug: field(formData, "modelSlug"),
    modelName: field(formData, "modelName"),
    generationSlug: field(formData, "generationSlug"),
    generationName: field(formData, "generationName"),
    modificationSlug: field(formData, "modificationSlug"),
    modificationName: field(formData, "modificationName"),
    engineSlug: field(formData, "engineSlug"),
    engineName: field(formData, "engineName"),
  });
}
