import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import {
  IntegrationNotConfiguredError,
  unconfiguredSupplierCatalog,
} from "@/modules/integrations/ports";

export async function probeSupplierApi(supplierId: string): Promise<never> {
  const supplier = await getPrismaClient().supplier.findUnique({
    where: { id: supplierId },
  });
  if (!supplier) {
    throw new IntegrationNotConfiguredError("supplier-catalog");
  }
  const key = supplier.credentialsEnvKey?.trim();
  if (!supplier.apiEnabled || !key || !process.env[key]) {
    throw new IntegrationNotConfiguredError(supplier.code);
  }
  await unconfiguredSupplierCatalog.searchByArticle("probe");
  throw new IntegrationNotConfiguredError(supplier.code);
}
