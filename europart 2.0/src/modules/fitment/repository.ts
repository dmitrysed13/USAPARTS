import "server-only";

import { withDatabase } from "@/lib/db/errors";
import { getPrismaClient } from "@/lib/db/prisma";

export type PublicVehicleBrand = {
  id: string;
  name: string;
  slug: string;
  logo: string | null;
  description: string | null;
};

export type PublicVehicleModel = {
  id: string;
  name: string;
  slug: string;
  generation: string | null;
  startYear: number | null;
  endYear: number | null;
};

export type PublicModification = {
  id: string;
  name: string;
  yearFrom: number | null;
  yearTo: number | null;
  engine: string | null;
  engineCode: string | null;
  fuelType: string | null;
  displacement: string | null;
  power: number | null;
  bodyType: string | null;
  transmission: string | null;
  driveType: string | null;
};

function db() {
  return getPrismaClient();
}

export async function listVehicleBrands(): Promise<PublicVehicleBrand[]> {
  return withDatabase(() =>
    db().vehicleBrand.findMany({
      where: { isActive: true },
      orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
      },
    }),
  );
}

export async function getVehicleBrand(slug: string): Promise<
  | (PublicVehicleBrand & {
      models: PublicVehicleModel[];
    })
  | null
> {
  return withDatabase(() =>
    db().vehicleBrand.findFirst({
      where: { slug, isActive: true },
      select: {
        id: true,
        name: true,
        slug: true,
        logo: true,
        description: true,
        models: {
          where: { isActive: true },
          orderBy: [{ name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            generation: true,
            startYear: true,
            endYear: true,
          },
        },
      },
    }),
  );
}

export async function getVehicleModel(
  brandSlug: string,
  modelSlug: string,
): Promise<
  | (PublicVehicleModel & {
      brand: PublicVehicleBrand;
      modifications: PublicModification[];
    })
  | null
> {
  const row = await withDatabase(() =>
    db().vehicleModel.findFirst({
      where: {
        slug: modelSlug,
        isActive: true,
        brand: { slug: brandSlug, isActive: true },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        generation: true,
        startYear: true,
        endYear: true,
        brand: {
          select: {
            id: true,
            name: true,
            slug: true,
            logo: true,
            description: true,
          },
        },
        modifications: {
          orderBy: [{ yearFrom: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            yearFrom: true,
            yearTo: true,
            engine: true,
            engineCode: true,
            fuelType: true,
            displacement: true,
            power: true,
            bodyType: true,
            transmission: true,
            driveType: true,
          },
        },
      },
    }),
  );
  if (!row) {
    return null;
  }
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    generation: row.generation,
    startYear: row.startYear,
    endYear: row.endYear,
    brand: row.brand,
    modifications: row.modifications.map((item) => ({
      id: item.id,
      name: item.name,
      yearFrom: item.yearFrom,
      yearTo: item.yearTo,
      engine: item.engine,
      engineCode: item.engineCode,
      fuelType: item.fuelType,
      displacement: item.displacement ? item.displacement.toString() : null,
      power: item.power,
      bodyType: item.bodyType,
      transmission: item.transmission,
      driveType: item.driveType,
    })),
  };
}
