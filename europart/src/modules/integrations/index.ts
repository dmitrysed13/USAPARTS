import type { AppModule } from "@/modules/types";

export const integrationsModule = {
  id: "integrations",
  stage: 5,
  summary:
    "Порты поставщиков (SupplierAdapter), TecDoc, VIN, доставки, оплаты, почты и 1С. Без ключей — fail closed.",
} satisfies AppModule;

export {
  IntegrationNotConfiguredError,
  unconfiguredNotifications,
  unconfiguredSupplierCatalog,
  type NotificationPort,
  type SupplierCatalogPort,
  type SupplierSearchHit,
} from "@/modules/integrations/ports";
export {
  resolveSupplierAdapter,
  runSupplierSync,
  unconfiguredSupplierAdapter,
  withRetry,
  takeRateToken,
  type SupplierAdapter,
} from "@/modules/integrations/supplier-adapter";
