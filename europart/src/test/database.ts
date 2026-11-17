import { getPrismaClient } from "@/lib/db/prisma";

export function assertTestDatabase(): void {
  const url = process.env.DATABASE_URL ?? "";
  if (!url.includes("europart_test")) {
    throw new Error("Интеграционные тесты запускаются только на базе europart_test.");
  }
}

export async function resetCatalogTables(): Promise<void> {
  assertTestDatabase();
  await getPrismaClient().$executeRawUnsafe(`
    TRUNCATE TABLE
      "OrderItem",
      "Order",
      "Lead",
      "ProductOffer",
      "ProductCompatibility",
      "ProductIdentifier",
      "ProductImage",
      "Product",
      "VehicleEngine",
      "VehicleModification",
      "VehicleGeneration",
      "VehicleModel",
      "VehicleBrand",
      "PartBrand",
      "Category",
      "VinRequestHistory",
      "VinRequest",
      "Warehouse",
      "Supplier",
      "SeoMetadata",
      "RedirectRule",
      "CompanySettings",
      "StaffUser"
    RESTART IDENTITY CASCADE
  `);
}
