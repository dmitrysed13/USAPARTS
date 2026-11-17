import type { AppModule } from "@/modules/types";

export const inventoryModule = {
  id: "inventory",
  stage: 5,
  summary:
    "Склады, остатки, поставщики и предложения. Неподтверждённый остаток на витрину не отдаётся.",
} satisfies AppModule;

export {
  createSupplier,
  deactivateSupplier,
  getSupplier,
  listSuppliers,
  supplierError,
  updateSupplier,
} from "@/modules/inventory/suppliers";
export {
  createWarehouse,
  deactivateWarehouse,
  listWarehouses,
} from "@/modules/inventory/warehouses";
export {
  getManagerOffer,
  listOffers,
  upsertOffer,
} from "@/modules/inventory/offers";
