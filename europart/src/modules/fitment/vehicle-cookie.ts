import { createHmac, timingSafeEqual } from "node:crypto";

export type SelectedVehicle = {
  brandSlug: string;
  brandName: string;
  modelSlug?: string;
  modelName?: string;
  generationSlug?: string;
  generationName?: string;
  modificationSlug?: string;
  modificationName?: string;
  engineSlug?: string;
  engineName?: string;
};

export const VEHICLE_COOKIE = "europart_vehicle";

function cookieSecure(source: Record<string, string | undefined> = process.env): boolean {
  const url = source.NEXT_PUBLIC_SITE_URL ?? "";
  return url.startsWith("https://");
}

export function resolveVehicleSecret(
  source: Record<string, string | undefined> = process.env,
): string | null {
  const dedicated = source.VEHICLE_SECRET?.trim();
  if (dedicated && dedicated.length >= 16) {
    return dedicated;
  }
  const cart = source.CART_SECRET?.trim();
  if (cart && cart.length >= 16) {
    return cart;
  }
  const auth = source.BETTER_AUTH_SECRET?.trim();
  if (auth && auth.length >= 32) {
    return auth;
  }
  if (source.NODE_ENV !== "production") {
    return "local-dev-vehicle-secret-not-for-production";
  }
  return null;
}

function sanitizeSlug(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim().toLowerCase();
  if (!trimmed || trimmed.length > 80 || !/^[a-z0-9-]+$/.test(trimmed)) {
    return undefined;
  }
  return trimmed;
}

function sanitizeName(value: unknown): string | undefined {
  if (typeof value !== "string") {
    return undefined;
  }
  const trimmed = value.trim().slice(0, 120);
  return trimmed || undefined;
}

export function normalizeSelectedVehicle(
  input: Partial<SelectedVehicle> | null | undefined,
): SelectedVehicle | null {
  if (!input) {
    return null;
  }
  const brandSlug = sanitizeSlug(input.brandSlug);
  const brandName = sanitizeName(input.brandName);
  if (!brandSlug || !brandName) {
    return null;
  }
  const modelSlug = sanitizeSlug(input.modelSlug);
  const modelName = sanitizeName(input.modelName);
  const generationSlug = sanitizeSlug(input.generationSlug);
  const generationName = sanitizeName(input.generationName);
  const modificationSlug = sanitizeSlug(input.modificationSlug);
  const modificationName = sanitizeName(input.modificationName);
  const engineSlug = sanitizeSlug(input.engineSlug);
  const engineName = sanitizeName(input.engineName);

  const selected: SelectedVehicle = { brandSlug, brandName };
  if (modelSlug && modelName) {
    selected.modelSlug = modelSlug;
    selected.modelName = modelName;
  }
  if (selected.modelSlug && generationSlug && generationName) {
    selected.generationSlug = generationSlug;
    selected.generationName = generationName;
  }
  if (selected.generationSlug && modificationSlug && modificationName) {
    selected.modificationSlug = modificationSlug;
    selected.modificationName = modificationName;
  }
  if (selected.modificationSlug && engineSlug && engineName) {
    selected.engineSlug = engineSlug;
    selected.engineName = engineName;
  }
  return selected;
}

export function encodeSelectedVehicle(vehicle: SelectedVehicle, secret: string): string {
  const normalized = normalizeSelectedVehicle(vehicle);
  if (!normalized) {
    throw new Error("Некорректный выбранный автомобиль.");
  }
  const body = Buffer.from(JSON.stringify(normalized)).toString("base64url");
  const mac = createHmac("sha256", secret).update(body).digest("base64url");
  return `${body}.${mac}`;
}

export function decodeSelectedVehicle(
  raw: string | undefined,
  secret: string,
): SelectedVehicle | null {
  if (!raw) {
    return null;
  }
  const [body, mac] = raw.split(".");
  if (!body || !mac) {
    return null;
  }
  const expected = createHmac("sha256", secret).update(body).digest("base64url");
  const left = Buffer.from(mac);
  const right = Buffer.from(expected);
  if (left.length !== right.length || !timingSafeEqual(left, right)) {
    return null;
  }
  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8")) as unknown;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    return normalizeSelectedVehicle(parsed as Partial<SelectedVehicle>);
  } catch {
    return null;
  }
}

export function vehicleCookieOptions(
  source: Record<string, string | undefined> = process.env,
) {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: cookieSecure(source),
    path: "/",
    maxAge: 60 * 60 * 24 * 90,
  };
}

export function vehicleHref(vehicle: SelectedVehicle): string {
  let path = `/brands/${vehicle.brandSlug}`;
  if (vehicle.modelSlug) {
    path += `/${vehicle.modelSlug}`;
  }
  if (vehicle.generationSlug) {
    path += `/${vehicle.generationSlug}`;
  }
  if (vehicle.modificationSlug) {
    path += `/${vehicle.modificationSlug}`;
  }
  if (vehicle.engineSlug) {
    path += `/${vehicle.engineSlug}`;
  }
  return path;
}
