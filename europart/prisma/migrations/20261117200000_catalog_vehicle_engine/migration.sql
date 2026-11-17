-- EUROPART Этап 2 — VehicleEngine level + modification slug uniqueness + SEO entity types.
-- Additive. No product/price/stock seed.

ALTER TYPE "SeoEntityType" ADD VALUE IF NOT EXISTS 'VEHICLE_MODIFICATION';
ALTER TYPE "SeoEntityType" ADD VALUE IF NOT EXISTS 'VEHICLE_ENGINE';

-- Backfill modification slugs before NOT NULL / unique.
UPDATE "VehicleModification"
SET "slug" = LOWER(REGEXP_REPLACE(REGEXP_REPLACE(TRIM("name"), '[^a-zA-Z0-9а-яА-ЯёЁ]+', '-', 'g'), '(^-|-$)', '', 'g'))
WHERE "slug" IS NULL OR TRIM("slug") = '';

UPDATE "VehicleModification" AS vm
SET "slug" = LEFT(vm."slug", 60) || '-' || SUBSTRING(REPLACE(vm."id"::text, '-', ''), 1, 8)
WHERE EXISTS (
  SELECT 1
  FROM "VehicleModification" other
  WHERE other."generationId" = vm."generationId"
    AND other."slug" = vm."slug"
    AND other."id" <> vm."id"
);

ALTER TABLE "VehicleModification"
  ALTER COLUMN "slug" SET NOT NULL,
  ADD COLUMN IF NOT EXISTS "isActive" BOOLEAN NOT NULL DEFAULT true;

CREATE UNIQUE INDEX IF NOT EXISTS "VehicleModification_generationId_slug_key"
  ON "VehicleModification"("generationId", "slug");
CREATE INDEX IF NOT EXISTS "VehicleModification_generationId_isActive_idx"
  ON "VehicleModification"("generationId", "isActive");

CREATE TABLE "VehicleEngine" (
    "id" UUID NOT NULL,
    "modificationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "code" TEXT,
    "fuelType" TEXT,
    "displacement" DECIMAL(4,2),
    "power" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "VehicleEngine_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "VehicleEngine_modificationId_slug_key" ON "VehicleEngine"("modificationId", "slug");
CREATE INDEX "VehicleEngine_modificationId_isActive_idx" ON "VehicleEngine"("modificationId", "isActive");
CREATE INDEX "VehicleEngine_code_idx" ON "VehicleEngine"("code");

ALTER TABLE "VehicleEngine"
  ADD CONSTRAINT "VehicleEngine_modificationId_fkey"
  FOREIGN KEY ("modificationId") REFERENCES "VehicleModification"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE "ProductCompatibility"
  ADD COLUMN "vehicleEngineId" UUID;

CREATE INDEX "ProductCompatibility_vehicleEngineId_confidence_idx"
  ON "ProductCompatibility"("vehicleEngineId", "confidence");

ALTER TABLE "ProductCompatibility"
  ADD CONSTRAINT "ProductCompatibility_vehicleEngineId_fkey"
  FOREIGN KEY ("vehicleEngineId") REFERENCES "VehicleEngine"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- Catalog query helpers (Product already indexed on categoryId+status)
CREATE INDEX IF NOT EXISTS "ProductCompatibility_confidence_modification_idx"
  ON "ProductCompatibility"("confidence", "vehicleModificationId");
