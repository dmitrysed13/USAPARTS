import { adminModule } from "@/modules/admin";
import { b2bModule } from "@/modules/b2b";
import { catalogModule } from "@/modules/catalog";
import { commerceModule } from "@/modules/commerce";
import { contentModule } from "@/modules/content";
import { fitmentModule } from "@/modules/fitment";
import { identityModule } from "@/modules/identity";
import { importsModule } from "@/modules/imports";
import { integrationsModule } from "@/modules/integrations";
import { inventoryModule } from "@/modules/inventory";
import { notificationsModule } from "@/modules/notifications";
import { searchModule } from "@/modules/search";
import { seoModule } from "@/modules/seo";
import type { AppModule } from "@/modules/types";

export const appModules = [
  catalogModule,
  fitmentModule,
  searchModule,
  commerceModule,
  identityModule,
  b2bModule,
  inventoryModule,
  importsModule,
  integrationsModule,
  notificationsModule,
  contentModule,
  seoModule,
  adminModule,
] as const satisfies readonly AppModule[];
