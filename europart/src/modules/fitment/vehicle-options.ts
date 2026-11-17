import "server-only";

import {
  getVehicleBrand,
  getVehicleGeneration,
  getVehicleModel,
  getVehicleModification,
  listVehicleBrands,
} from "@/modules/fitment/repository";

export type VehicleOption = { value: string; label: string };

function yearOptions(
  start: number | null | undefined,
  end: number | null | undefined,
): VehicleOption[] {
  if (!start && !end) {
    return [];
  }
  const from = start ?? end!;
  const to = end ?? start!;
  const years: VehicleOption[] = [];
  for (let year = from; year <= to; year += 1) {
    years.push({ value: String(year), label: String(year) });
  }
  return years;
}

export async function listVehicleOptionLevel(input: {
  brand?: string;
  model?: string;
  generation?: string;
  modification?: string;
  year?: string;
}): Promise<{
  level: "brand" | "model" | "generation" | "year" | "modification" | "engine";
  options: VehicleOption[];
  names?: {
    brandName?: string;
    modelName?: string;
    generationName?: string;
    modificationName?: string;
  };
}> {
  if (!input.brand) {
    const brands = await listVehicleBrands();
    return {
      level: "brand",
      options: brands.map((brand) => ({ value: brand.slug, label: brand.name })),
    };
  }

  if (!input.model) {
    const brand = await getVehicleBrand(input.brand);
    if (!brand) {
      return { level: "model", options: [] };
    }
    return {
      level: "model",
      options: brand.models.map((model) => ({ value: model.slug, label: model.name })),
      names: { brandName: brand.name },
    };
  }

  if (!input.generation) {
    const model = await getVehicleModel(input.brand, input.model);
    if (!model) {
      return { level: "generation", options: [] };
    }
    return {
      level: "generation",
      options: model.generations.map((generation) => ({
        value: generation.slug,
        label: generation.name,
      })),
      names: { brandName: model.brand.name, modelName: model.name },
    };
  }

  const generation = await getVehicleGeneration(
    input.brand,
    input.model,
    input.generation,
  );
  if (!generation) {
    return { level: "year", options: [] };
  }

  if (!input.year) {
    const years = yearOptions(generation.startYear, generation.endYear);
    if (years.length > 0) {
      return {
        level: "year",
        options: years,
        names: {
          brandName: generation.brand.name,
          modelName: generation.model.name,
          generationName: generation.name,
        },
      };
    }
  }

  if (!input.modification) {
    return {
      level: "modification",
      options: generation.modifications.map((modification) => ({
        value: modification.slug,
        label: modification.name,
      })),
      names: {
        brandName: generation.brand.name,
        modelName: generation.model.name,
        generationName: generation.name,
      },
    };
  }

  const modification = await getVehicleModification(
    input.brand,
    input.model,
    input.generation,
    input.modification,
  );
  if (!modification) {
    return { level: "engine", options: [] };
  }
  return {
    level: "engine",
    options: modification.engines.map((engine) => ({
      value: engine.slug,
      label: engine.code ? `${engine.name} (${engine.code})` : engine.name,
    })),
    names: {
      brandName: modification.brand.name,
      modelName: modification.model.name,
      generationName: modification.generation.name,
      modificationName: modification.name,
    },
  };
}
