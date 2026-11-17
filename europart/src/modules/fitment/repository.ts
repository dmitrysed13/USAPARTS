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
  startYear: number | null;
  endYear: number | null;
};

export type PublicVehicleGeneration = {
  id: string;
  name: string;
  slug: string;
  startYear: number | null;
  endYear: number | null;
};

export type PublicVehicleEngine = {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  fuelType: string | null;
  displacement: string | null;
  power: number | null;
};

export type PublicModification = {
  id: string;
  name: string;
  slug: string;
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
  engines: PublicVehicleEngine[];
};

function db() {
  return getPrismaClient();
}

function mapEngine(item: {
  id: string;
  name: string;
  slug: string;
  code: string | null;
  fuelType: string | null;
  displacement: { toString(): string } | null;
  power: number | null;
}): PublicVehicleEngine {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
    code: item.code,
    fuelType: item.fuelType,
    displacement: item.displacement ? item.displacement.toString() : null,
    power: item.power,
  };
}

function mapModification(item: {
  id: string;
  name: string;
  slug: string;
  yearFrom: number | null;
  yearTo: number | null;
  engine: string | null;
  engineCode: string | null;
  fuelType: string | null;
  displacement: { toString(): string } | null;
  power: number | null;
  bodyType: string | null;
  transmission: string | null;
  driveType: string | null;
  engines?: Array<{
    id: string;
    name: string;
    slug: string;
    code: string | null;
    fuelType: string | null;
    displacement: { toString(): string } | null;
    power: number | null;
  }>;
}): PublicModification {
  return {
    id: item.id,
    name: item.name,
    slug: item.slug,
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
    engines: (item.engines ?? []).map(mapEngine),
  };
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
      generations: PublicVehicleGeneration[];
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
        generations: {
          where: { isActive: true },
          orderBy: [{ startYear: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            startYear: true,
            endYear: true,
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
    startYear: row.startYear,
    endYear: row.endYear,
    brand: row.brand,
    generations: row.generations,
  };
}

export async function getVehicleGeneration(
  brandSlug: string,
  modelSlug: string,
  generationSlug: string,
): Promise<
  | (PublicVehicleGeneration & {
      brand: PublicVehicleBrand;
      model: PublicVehicleModel;
      modifications: PublicModification[];
    })
  | null
> {
  const row = await withDatabase(() =>
    db().vehicleGeneration.findFirst({
      where: {
        slug: generationSlug,
        isActive: true,
        model: {
          slug: modelSlug,
          isActive: true,
          brand: { slug: brandSlug, isActive: true },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        startYear: true,
        endYear: true,
        model: {
          select: {
            id: true,
            name: true,
            slug: true,
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
          },
        },
        modifications: {
          where: { isActive: true },
          orderBy: [{ yearFrom: "asc" }, { name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
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
            engines: {
              where: { isActive: true },
              orderBy: [{ name: "asc" }],
              select: {
                id: true,
                name: true,
                slug: true,
                code: true,
                fuelType: true,
                displacement: true,
                power: true,
              },
            },
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
    startYear: row.startYear,
    endYear: row.endYear,
    brand: row.model.brand,
    model: {
      id: row.model.id,
      name: row.model.name,
      slug: row.model.slug,
      startYear: row.model.startYear,
      endYear: row.model.endYear,
    },
    modifications: row.modifications.map(mapModification),
  };
}

export async function getVehicleModification(
  brandSlug: string,
  modelSlug: string,
  generationSlug: string,
  modificationSlug: string,
): Promise<
  | (PublicModification & {
      brand: PublicVehicleBrand;
      model: PublicVehicleModel;
      generation: PublicVehicleGeneration;
    })
  | null
> {
  const row = await withDatabase(() =>
    db().vehicleModification.findFirst({
      where: {
        slug: modificationSlug,
        isActive: true,
        generation: {
          slug: generationSlug,
          isActive: true,
          model: {
            slug: modelSlug,
            isActive: true,
            brand: { slug: brandSlug, isActive: true },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
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
        engines: {
          where: { isActive: true },
          orderBy: [{ name: "asc" }],
          select: {
            id: true,
            name: true,
            slug: true,
            code: true,
            fuelType: true,
            displacement: true,
            power: true,
          },
        },
        generation: {
          select: {
            id: true,
            name: true,
            slug: true,
            startYear: true,
            endYear: true,
            model: {
              select: {
                id: true,
                name: true,
                slug: true,
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
              },
            },
          },
        },
      },
    }),
  );
  if (!row) {
    return null;
  }
  return {
    ...mapModification(row),
    brand: row.generation.model.brand,
    model: {
      id: row.generation.model.id,
      name: row.generation.model.name,
      slug: row.generation.model.slug,
      startYear: row.generation.model.startYear,
      endYear: row.generation.model.endYear,
    },
    generation: {
      id: row.generation.id,
      name: row.generation.name,
      slug: row.generation.slug,
      startYear: row.generation.startYear,
      endYear: row.generation.endYear,
    },
  };
}

export async function getVehicleEngine(
  brandSlug: string,
  modelSlug: string,
  generationSlug: string,
  modificationSlug: string,
  engineSlug: string,
): Promise<
  | (PublicVehicleEngine & {
      brand: PublicVehicleBrand;
      model: PublicVehicleModel;
      generation: PublicVehicleGeneration;
      modification: PublicModification;
    })
  | null
> {
  const row = await withDatabase(() =>
    db().vehicleEngine.findFirst({
      where: {
        slug: engineSlug,
        isActive: true,
        modification: {
          slug: modificationSlug,
          isActive: true,
          generation: {
            slug: generationSlug,
            isActive: true,
            model: {
              slug: modelSlug,
              isActive: true,
              brand: { slug: brandSlug, isActive: true },
            },
          },
        },
      },
      select: {
        id: true,
        name: true,
        slug: true,
        code: true,
        fuelType: true,
        displacement: true,
        power: true,
        modification: {
          select: {
            id: true,
            name: true,
            slug: true,
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
            engines: {
              where: { isActive: true },
              orderBy: [{ name: "asc" }],
              select: {
                id: true,
                name: true,
                slug: true,
                code: true,
                fuelType: true,
                displacement: true,
                power: true,
              },
            },
            generation: {
              select: {
                id: true,
                name: true,
                slug: true,
                startYear: true,
                endYear: true,
                model: {
                  select: {
                    id: true,
                    name: true,
                    slug: true,
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
                  },
                },
              },
            },
          },
        },
      },
    }),
  );
  if (!row) {
    return null;
  }
  const modification = mapModification(row.modification);
  return {
    ...mapEngine(row),
    brand: row.modification.generation.model.brand,
    model: {
      id: row.modification.generation.model.id,
      name: row.modification.generation.model.name,
      slug: row.modification.generation.model.slug,
      startYear: row.modification.generation.model.startYear,
      endYear: row.modification.generation.model.endYear,
    },
    generation: {
      id: row.modification.generation.id,
      name: row.modification.generation.name,
      slug: row.modification.generation.slug,
      startYear: row.modification.generation.startYear,
      endYear: row.modification.generation.endYear,
    },
    modification,
  };
}
