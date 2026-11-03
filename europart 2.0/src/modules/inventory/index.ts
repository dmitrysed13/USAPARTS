import type { AppModule } from "@/modules/types";

export const inventoryModule = {
  id: "inventory",
  stage: 3,
  summary: "Склады, остатки, резерв и поставщики. Закупочные цены наружу не отдаются.",
} satisfies AppModule;
