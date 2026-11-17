import "server-only";

import { cookies } from "next/headers";
import {
  decodeSelectedVehicle,
  encodeSelectedVehicle,
  normalizeSelectedVehicle,
  resolveVehicleSecret,
  VEHICLE_COOKIE,
  vehicleCookieOptions,
  type SelectedVehicle,
} from "@/modules/fitment/vehicle-cookie";

export async function readSelectedVehicle(): Promise<SelectedVehicle | null> {
  const secret = resolveVehicleSecret();
  if (!secret) {
    return null;
  }
  const jar = await cookies();
  return decodeSelectedVehicle(jar.get(VEHICLE_COOKIE)?.value, secret);
}

export async function writeSelectedVehicle(
  vehicle: SelectedVehicle | null,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const secret = resolveVehicleSecret();
  if (!secret) {
    return {
      ok: false,
      message:
        "Выбор автомобиля недоступен: задайте VEHICLE_SECRET или CART_SECRET (от 16 символов).",
    };
  }
  const jar = await cookies();
  if (!vehicle) {
    jar.delete(VEHICLE_COOKIE);
    return { ok: true };
  }
  const normalized = normalizeSelectedVehicle(vehicle);
  if (!normalized) {
    return { ok: false, message: "Некорректные данные автомобиля." };
  }
  jar.set(VEHICLE_COOKIE, encodeSelectedVehicle(normalized, secret), vehicleCookieOptions());
  return { ok: true };
}
