import { selectVehicleFromFormAction } from "@/modules/fitment/select-vehicle";
import type { SelectedVehicle } from "@/modules/fitment/vehicle-cookie";
import { buttonClassName } from "@/components/ui/button";

export function SelectVehicleButton({ vehicle }: { vehicle: SelectedVehicle }) {
  return (
    <form action={selectVehicleFromFormAction} className="inline-flex">
      <input name="brandSlug" type="hidden" value={vehicle.brandSlug} />
      <input name="brandName" type="hidden" value={vehicle.brandName} />
      {vehicle.modelSlug ? (
        <input name="modelSlug" type="hidden" value={vehicle.modelSlug} />
      ) : null}
      {vehicle.modelName ? (
        <input name="modelName" type="hidden" value={vehicle.modelName} />
      ) : null}
      {vehicle.generationSlug ? (
        <input name="generationSlug" type="hidden" value={vehicle.generationSlug} />
      ) : null}
      {vehicle.generationName ? (
        <input name="generationName" type="hidden" value={vehicle.generationName} />
      ) : null}
      {vehicle.modificationSlug ? (
        <input name="modificationSlug" type="hidden" value={vehicle.modificationSlug} />
      ) : null}
      {vehicle.modificationName ? (
        <input name="modificationName" type="hidden" value={vehicle.modificationName} />
      ) : null}
      {vehicle.engineSlug ? (
        <input name="engineSlug" type="hidden" value={vehicle.engineSlug} />
      ) : null}
      {vehicle.engineName ? (
        <input name="engineName" type="hidden" value={vehicle.engineName} />
      ) : null}
      <button className={buttonClassName("secondary")} type="submit">
        Выбрать этот автомобиль
      </button>
    </form>
  );
}
