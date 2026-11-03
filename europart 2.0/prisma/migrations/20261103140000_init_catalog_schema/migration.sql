-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- Trigram search for names and partial article matches.
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- CreateEnum
CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'USED');

-- CreateEnum
CREATE TYPE "ProductKind" AS ENUM ('ORIGINAL', 'ANALOG');

-- CreateEnum
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "IdentifierType" AS ENUM ('OEM', 'ARTICLE', 'CROSS_REFERENCE');

-- CreateEnum
CREATE TYPE "OfferSourceType" AS ENUM ('OWN_STOCK', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "OfferAvailability" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'ON_ORDER', 'INCOMING', 'OUT_OF_STOCK', 'DISCONTINUED', 'UNKNOWN');

-- CreateEnum
CREATE TYPE "WarehouseType" AS ENUM ('OWN', 'SUPPLIER');

-- CreateEnum
CREATE TYPE "CompatibilitySource" AS ENUM ('MANUAL', 'SUPPLIER_FEED', 'TECDOC', 'VIN_CONFIRMED');

-- CreateEnum
CREATE TYPE "CompatibilityConfidence" AS ENUM ('UNVERIFIED', 'PROBABLE', 'VERIFIED');

-- CreateEnum
CREATE TYPE "VinRequestStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "SeoEntityType" AS ENUM ('CATEGORY', 'VEHICLE_BRAND', 'VEHICLE_MODEL', 'PRODUCT', 'PART_BRAND');

-- CreateTable
CREATE TABLE "Category" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "parentId" UUID,
    "image" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleBrand" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "VehicleBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleModel" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "generation" TEXT,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "VehicleModel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VehicleModification" (
    "id" UUID NOT NULL,
    "modelId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "yearFrom" INTEGER,
    "yearTo" INTEGER,
    "engine" TEXT,
    "engineCode" TEXT,
    "fuelType" TEXT,
    "displacement" DECIMAL(4,2),
    "power" INTEGER,
    "bodyType" TEXT,
    "transmission" TEXT,
    "driveType" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "VehicleModification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PartBrand" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "logo" TEXT,
    "country" TEXT,
    "description" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "PartBrand_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Product" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "categoryId" UUID NOT NULL,
    "partBrandId" UUID,
    "article" TEXT,
    "articleNormalized" TEXT,
    "oem" TEXT,
    "condition" "ProductCondition" NOT NULL,
    "productType" "ProductKind" NOT NULL,
    "status" "ProductStatus" NOT NULL DEFAULT 'DRAFT',
    "weight" DECIMAL(10,3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Product_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductIdentifier" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "value" TEXT NOT NULL,
    "normalizedValue" TEXT NOT NULL,
    "type" "IdentifierType" NOT NULL,
    "brandId" UUID,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductIdentifier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductImage" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductCompatibility" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "vehicleModificationId" UUID NOT NULL,
    "compatibilitySource" "CompatibilitySource" NOT NULL,
    "confidence" "CompatibilityConfidence" NOT NULL DEFAULT 'UNVERIFIED',
    "note" TEXT,
    "verifiedAt" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductCompatibility_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Warehouse" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "type" "WarehouseType" NOT NULL,
    "supplierId" UUID,
    "city" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "Warehouse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ProductOffer" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sourceType" "OfferSourceType" NOT NULL,
    "supplierId" UUID,
    "warehouseId" UUID,
    "purchasePrice" DECIMAL(12,2),
    "retailPrice" DECIMAL(12,2),
    "b2bPrice" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'BYN',
    "quantity" INTEGER NOT NULL DEFAULT 0,
    "reservedQuantity" INTEGER NOT NULL DEFAULT 0,
    "availabilityStatus" "OfferAvailability" NOT NULL DEFAULT 'UNKNOWN',
    "leadTime" INTEGER,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ProductOffer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VinRequest" (
    "id" UUID NOT NULL,
    "vin" TEXT NOT NULL,
    "vinIsStandard" BOOLEAN NOT NULL,
    "vehicleBrand" TEXT,
    "vehicleModel" TEXT,
    "vehicleYear" INTEGER,
    "engine" TEXT,
    "partName" TEXT,
    "partNumber" TEXT,
    "customerName" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "comment" TEXT,
    "consentAccepted" BOOLEAN NOT NULL,
    "consentAt" TIMESTAMPTZ(3) NOT NULL,
    "ip" TEXT,
    "status" "VinRequestStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "VinRequest_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SeoMetadata" (
    "id" UUID NOT NULL,
    "entityType" "SeoEntityType" NOT NULL,
    "entityId" UUID NOT NULL,
    "title" TEXT,
    "description" TEXT,
    "h1" TEXT,
    "canonicalPath" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SeoMetadata_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");

-- CreateIndex
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");

-- CreateIndex
CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleBrand_slug_key" ON "VehicleBrand"("slug");

-- CreateIndex
CREATE INDEX "VehicleBrand_isActive_sortOrder_idx" ON "VehicleBrand"("isActive", "sortOrder");

-- CreateIndex
CREATE INDEX "VehicleModel_brandId_isActive_idx" ON "VehicleModel"("brandId", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "VehicleModel_brandId_slug_key" ON "VehicleModel"("brandId", "slug");

-- CreateIndex
CREATE INDEX "VehicleModification_modelId_idx" ON "VehicleModification"("modelId");

-- CreateIndex
CREATE INDEX "VehicleModification_engineCode_idx" ON "VehicleModification"("engineCode");

-- CreateIndex
CREATE UNIQUE INDEX "PartBrand_slug_key" ON "PartBrand"("slug");

-- CreateIndex
CREATE INDEX "PartBrand_isActive_idx" ON "PartBrand"("isActive");

-- CreateIndex
CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");

-- CreateIndex
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");

-- CreateIndex
CREATE INDEX "Product_partBrandId_idx" ON "Product"("partBrandId");

-- CreateIndex
CREATE INDEX "Product_articleNormalized_idx" ON "Product"("articleNormalized");

-- CreateIndex
CREATE INDEX "Product_status_idx" ON "Product"("status");

-- CreateIndex
CREATE INDEX "ProductIdentifier_normalizedValue_idx" ON "ProductIdentifier"("normalizedValue");

-- CreateIndex
CREATE INDEX "ProductIdentifier_type_normalizedValue_idx" ON "ProductIdentifier"("type", "normalizedValue");

-- CreateIndex
CREATE UNIQUE INDEX "ProductIdentifier_productId_type_normalizedValue_key" ON "ProductIdentifier"("productId", "type", "normalizedValue");

-- CreateIndex
CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");

-- CreateIndex
CREATE INDEX "ProductCompatibility_vehicleModificationId_confidence_idx" ON "ProductCompatibility"("vehicleModificationId", "confidence");

-- CreateIndex
CREATE INDEX "ProductCompatibility_productId_confidence_idx" ON "ProductCompatibility"("productId", "confidence");

-- CreateIndex
CREATE UNIQUE INDEX "ProductCompatibility_productId_vehicleModificationId_key" ON "ProductCompatibility"("productId", "vehicleModificationId");

-- CreateIndex
CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");

-- CreateIndex
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");

-- CreateIndex
CREATE INDEX "Warehouse_supplierId_idx" ON "Warehouse"("supplierId");

-- CreateIndex
CREATE INDEX "ProductOffer_productId_availabilityStatus_idx" ON "ProductOffer"("productId", "availabilityStatus");

-- CreateIndex
CREATE INDEX "ProductOffer_supplierId_idx" ON "ProductOffer"("supplierId");

-- CreateIndex
CREATE INDEX "ProductOffer_warehouseId_idx" ON "ProductOffer"("warehouseId");

-- CreateIndex
CREATE INDEX "VinRequest_status_createdAt_idx" ON "VinRequest"("status", "createdAt");

-- CreateIndex
CREATE INDEX "VinRequest_vin_idx" ON "VinRequest"("vin");

-- CreateIndex
CREATE UNIQUE INDEX "SeoMetadata_entityType_entityId_key" ON "SeoMetadata"("entityType", "entityId");

-- AddForeignKey
ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleModel" ADD CONSTRAINT "VehicleModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "VehicleBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VehicleModification" ADD CONSTRAINT "VehicleModification_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Product" ADD CONSTRAINT "Product_partBrandId_fkey" FOREIGN KEY ("partBrandId") REFERENCES "PartBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIdentifier" ADD CONSTRAINT "ProductIdentifier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductIdentifier" ADD CONSTRAINT "ProductIdentifier_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "PartBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCompatibility" ADD CONSTRAINT "ProductCompatibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductCompatibility" ADD CONSTRAINT "ProductCompatibility_vehicleModificationId_fkey" FOREIGN KEY ("vehicleModificationId") REFERENCES "VehicleModification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Checks the Prisma schema cannot express.
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_quantity_nonnegative" CHECK (quantity >= 0);
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_reserved_nonnegative" CHECK ("reservedQuantity" >= 0);
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_reserved_within_quantity" CHECK ("reservedQuantity" <= quantity);
ALTER TABLE "VehicleModel" ADD CONSTRAINT "VehicleModel_years_ordered" CHECK ("endYear" IS NULL OR "startYear" IS NULL OR "endYear" >= "startYear");
ALTER TABLE "VehicleModification" ADD CONSTRAINT "VehicleModification_years_ordered" CHECK ("yearTo" IS NULL OR "yearFrom" IS NULL OR "yearTo" >= "yearFrom");
ALTER TABLE "VinRequest" ADD CONSTRAINT "VinRequest_contact_present" CHECK (phone IS NOT NULL OR email IS NOT NULL);
ALTER TABLE "VinRequest" ADD CONSTRAINT "VinRequest_consent_required" CHECK ("consentAccepted" = true);

CREATE INDEX "Product_name_trgm" ON "Product" USING gin (name gin_trgm_ops);
CREATE INDEX "ProductIdentifier_normalized_trgm" ON "ProductIdentifier" USING gin ("normalizedValue" gin_trgm_ops);
