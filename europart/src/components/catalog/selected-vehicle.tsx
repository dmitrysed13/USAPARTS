import Link from "next/link";
import { clearSelectedVehicleAction } from "@/modules/fitment/clear-vehicle";
import { vehicleHref } from "@/modules/fitment/vehicle-cookie";
import { readSelectedVehicle } from "@/modules/fitment/vehicle-http";

function label(parts: Array<string | undefined>): string {
  return parts.filter(Boolean).join(" · ");
}

export async function SelectedVehicleBanner() {
  const vehicle = await readSelectedVehicle();
  if (!vehicle) {
    return null;
  }
  const text = label([
    vehicle.brandName,
    vehicle.modelName,
    vehicle.generationName,
    vehicle.modificationName,
    vehicle.engineName,
  ]);
  return (
    <div className="border-b border-line bg-surface-muted/60">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-2 px-4 py-2 text-sm sm:px-6">
        <p className="text-ink-muted">
          Выбранный автомобиль:{" "}
          <Link className="font-semibold text-ink hover:text-brand" href={vehicleHref(vehicle)}>
            {text}
          </Link>
        </p>
        <form action={clearSelectedVehicleAction}>
          <button
            className="text-sm font-medium text-ink-muted underline-offset-2 hover:text-brand hover:underline"
            type="submit"
          >
            Сбросить
          </button>
        </form>
      </div>
    </div>
  );
}
