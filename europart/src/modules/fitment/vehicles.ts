import "server-only";

import { Prisma } from "@/generated/prisma/client";
import { withDatabase } from "@/lib/db/errors";
import { getPrismaClient } from "@/lib/db/prisma";
import { slugify } from "@/lib/slug";

export class VehicleAdminError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "VehicleAdminError";
  }
}

function db() {
  return getPrismaClient();
}

function requireName(name: unknown, label: string): string {
  const value = typeof name === "string" ? name.trim() : "";
  if (!value || value.length > 120) {
    throw new VehicleAdminError(`${label}: укажите название до 120 символов.`);
  }
  return value;
}

function optionalSlug(slug: unknown, fromName: string): string {
  if (typeof slug === "string" && slug.trim()) {
    const value = slugify(slug.trim());
    if (!value) {
      throw new VehicleAdminError("Некорректный slug.");
    }
    return value;
  }
  return slugify(fromName);
}

function optionalYear(value: unknown): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const year = Number(value);
  if (!Number.isInteger(year) || year < 1950 || year > 2100) {
    throw new VehicleAdminError("Год должен быть целым числом от 1950 до 2100.");
  }
  return year;
}

function optionalInt(value: unknown, label: string): number | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 0 || parsed > 2000) {
    throw new VehicleAdminError(`${label}: некорректное значение.`);
  }
  return parsed;
}

function optionalText(value: unknown, max = 80): string | undefined {
  if (value === undefined || value === null) {
    return undefined;
  }
  const text = String(value).trim();
  if (!text) {
    return undefined;
  }
  if (text.length > max) {
    throw new VehicleAdminError(`Слишком длинное значение (макс. ${max}).`);
  }
  return text;
}

function optionalDecimal(value: unknown): Prisma.Decimal | undefined {
  if (value === undefined || value === null || value === "") {
    return undefined;
  }
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || parsed < 0 || parsed > 20) {
    throw new VehicleAdminError("Объём двигателя должен быть от 0 до 20 л.");
  }
  return new Prisma.Decimal(parsed.toFixed(2));
}

export function vehicleAdminError(error: unknown): string {
  if (error instanceof VehicleAdminError) {
    return error.message;
  }
  if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
    return "Запись с таким slug уже существует.";
  }
  return "Не сохранено.";
}

export async function createVehicleBrand(input: {
  name: unknown;
  slug?: unknown;
  description?: unknown;
  sortOrder?: unknown;
}) {
  const name = requireName(input.name, "Марка");
  const slug = optionalSlug(input.slug, name);
  const sortOrder = optionalInt(input.sortOrder, "Порядок") ?? 0;
  return withDatabase(() =>
    db().vehicleBrand.create({
      data: {
        name,
        slug,
        description: optionalText(input.description, 500),
        sortOrder,
      },
    }),
  );
}

export async function createVehicleModel(input: {
  brandId: unknown;
  name: unknown;
  slug?: unknown;
  startYear?: unknown;
  endYear?: unknown;
}) {
  const brandId = String(input.brandId ?? "");
  if (!brandId) {
    throw new VehicleAdminError("Нужен brandId.");
  }
  const name = requireName(input.name, "Модель");
  return withDatabase(() =>
    db().vehicleModel.create({
      data: {
        brandId,
        name,
        slug: optionalSlug(input.slug, name),
        startYear: optionalYear(input.startYear),
        endYear: optionalYear(input.endYear),
      },
    }),
  );
}

export async function createVehicleGeneration(input: {
  modelId: unknown;
  name: unknown;
  slug?: unknown;
  startYear?: unknown;
  endYear?: unknown;
}) {
  const modelId = String(input.modelId ?? "");
  if (!modelId) {
    throw new VehicleAdminError("Нужен modelId.");
  }
  const name = requireName(input.name, "Поколение");
  return withDatabase(() =>
    db().vehicleGeneration.create({
      data: {
        modelId,
        name,
        slug: optionalSlug(input.slug, name),
        startYear: optionalYear(input.startYear),
        endYear: optionalYear(input.endYear),
      },
    }),
  );
}

export async function createVehicleModification(input: {
  generationId: unknown;
  name: unknown;
  slug?: unknown;
  yearFrom?: unknown;
  yearTo?: unknown;
  engine?: unknown;
  engineCode?: unknown;
  fuelType?: unknown;
  displacement?: unknown;
  power?: unknown;
  bodyType?: unknown;
  transmission?: unknown;
  driveType?: unknown;
}) {
  const generationId = String(input.generationId ?? "");
  if (!generationId) {
    throw new VehicleAdminError("Нужен generationId.");
  }
  const name = requireName(input.name, "Модификация");
  return withDatabase(() =>
    db().vehicleModification.create({
      data: {
        generationId,
        name,
        slug: optionalSlug(input.slug, name),
        yearFrom: optionalYear(input.yearFrom),
        yearTo: optionalYear(input.yearTo),
        engine: optionalText(input.engine),
        engineCode: optionalText(input.engineCode),
        fuelType: optionalText(input.fuelType),
        displacement: optionalDecimal(input.displacement),
        power: optionalInt(input.power, "Мощность"),
        bodyType: optionalText(input.bodyType),
        transmission: optionalText(input.transmission),
        driveType: optionalText(input.driveType),
      },
    }),
  );
}

export async function createVehicleEngine(input: {
  modificationId: unknown;
  name: unknown;
  slug?: unknown;
  code?: unknown;
  fuelType?: unknown;
  displacement?: unknown;
  power?: unknown;
}) {
  const modificationId = String(input.modificationId ?? "");
  if (!modificationId) {
    throw new VehicleAdminError("Нужен modificationId.");
  }
  const name = requireName(input.name, "Двигатель");
  return withDatabase(() =>
    db().vehicleEngine.create({
      data: {
        modificationId,
        name,
        slug: optionalSlug(input.slug, name),
        code: optionalText(input.code),
        fuelType: optionalText(input.fuelType),
        displacement: optionalDecimal(input.displacement),
        power: optionalInt(input.power, "Мощность"),
      },
    }),
  );
}

export async function createCategory(input: {
  name: unknown;
  slug?: unknown;
  description?: unknown;
  parentId?: unknown;
  sortOrder?: unknown;
}) {
  const name = requireName(input.name, "Категория");
  const parentId =
    typeof input.parentId === "string" && input.parentId.trim()
      ? input.parentId.trim()
      : undefined;
  return withDatabase(() =>
    db().category.create({
      data: {
        name,
        slug: optionalSlug(input.slug, name),
        description: optionalText(input.description, 500),
        parentId,
        sortOrder: optionalInt(input.sortOrder, "Порядок") ?? 0,
      },
    }),
  );
}
