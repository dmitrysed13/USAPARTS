import type { AppModule } from "@/modules/types";

export const integrationsModule = {
  id: "integrations",
  stage: 6,
  summary: "Адаптеры поставщиков, TecDoc, VIN, доставки, оплаты, почты и 1С.",
} satisfies AppModule;

export {
  IntegrationNotConfiguredError,
  unconfiguredNotifications,
  unconfiguredSupplierCatalog,
  type NotificationPort,
  type SupplierCatalogPort,
  type SupplierSearchHit,
} from "@/modules/integrations/ports";
