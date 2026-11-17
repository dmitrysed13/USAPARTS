-- EUROPART 3.0 foundation schema
-- Hierarchy: Make → Model → Generation → Modification → Category → Product

CREATE SCHEMA IF NOT EXISTS "public";
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE TYPE "ProductCondition" AS ENUM ('NEW', 'USED');
CREATE TYPE "ProductKind" AS ENUM ('ORIGINAL', 'ANALOG');
CREATE TYPE "ProductStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');
CREATE TYPE "IdentifierType" AS ENUM ('OEM', 'ARTICLE', 'CROSS_REFERENCE', 'ANALOG');
CREATE TYPE "OfferSourceType" AS ENUM ('OWN_STOCK', 'SUPPLIER');
CREATE TYPE "OfferAvailability" AS ENUM ('IN_STOCK', 'LOW_STOCK', 'ON_ORDER', 'INCOMING', 'OUT_OF_STOCK', 'DISCONTINUED', 'UNKNOWN');
CREATE TYPE "WarehouseType" AS ENUM ('OWN', 'SUPPLIER');
CREATE TYPE "CompatibilitySource" AS ENUM ('MANUAL', 'SUPPLIER_FEED', 'TECDOC', 'VIN_CONFIRMED');
CREATE TYPE "CompatibilityConfidence" AS ENUM ('UNVERIFIED', 'PROBABLE', 'VERIFIED');
CREATE TYPE "VinRequestStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'ANSWERED', 'CLOSED', 'CANCELLED');
CREATE TYPE "OrderStatus" AS ENUM ('NEW', 'CONFIRMED', 'PROCESSING', 'SHIPPED', 'COMPLETED', 'CANCELLED');
CREATE TYPE "PaymentState" AS ENUM ('NOT_CONNECTED', 'AWAITING', 'PAID', 'FAILED', 'REFUNDED');
CREATE TYPE "LeadType" AS ENUM ('RARE_PART', 'PRICE_REQUEST', 'B2B', 'CONTACT');
CREATE TYPE "LeadStatus" AS ENUM ('NEW', 'IN_PROGRESS', 'CLOSED', 'CANCELLED');
CREATE TYPE "SeoEntityType" AS ENUM ('CATEGORY', 'VEHICLE_BRAND', 'VEHICLE_MODEL', 'VEHICLE_GENERATION', 'PRODUCT', 'PART_BRAND');

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

CREATE TABLE "VehicleModel" (
    "id" UUID NOT NULL,
    "brandId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "VehicleModel_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleGeneration" (
    "id" UUID NOT NULL,
    "modelId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "startYear" INTEGER,
    "endYear" INTEGER,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "VehicleGeneration_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "VehicleModification" (
    "id" UUID NOT NULL,
    "generationId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT,
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

CREATE TABLE "ProductImage" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    CONSTRAINT "ProductImage_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "Supplier" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Supplier_pkey" PRIMARY KEY ("id")
);

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

CREATE TABLE "Order" (
    "id" UUID NOT NULL,
    "number" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "status" "OrderStatus" NOT NULL DEFAULT 'NEW',
    "paymentState" "PaymentState" NOT NULL DEFAULT 'NOT_CONNECTED',
    "customerName" TEXT NOT NULL,
    "customerPhone" TEXT,
    "customerEmail" TEXT,
    "comment" TEXT,
    "deliveryMethod" TEXT,
    "deliveryAddress" TEXT,
    "deliveryNote" TEXT,
    "subtotalCents" INTEGER NOT NULL,
    "discountCents" INTEGER NOT NULL DEFAULT 0,
    "deliveryCents" INTEGER NOT NULL DEFAULT 0,
    "totalCents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BYN',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Order_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderItem" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "productId" UUID,
    "sku" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "unitPriceCents" INTEGER NOT NULL,
    "quantity" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BYN',
    CONSTRAINT "OrderItem_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "Lead" (
    "id" UUID NOT NULL,
    "type" "LeadType" NOT NULL,
    "status" "LeadStatus" NOT NULL DEFAULT 'NEW',
    "name" TEXT NOT NULL,
    "phone" TEXT,
    "email" TEXT,
    "message" TEXT,
    "productId" UUID,
    "vin" TEXT,
    "article" TEXT,
    "ip" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

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

CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_parentId_idx" ON "Category"("parentId");
CREATE INDEX "Category_isActive_sortOrder_idx" ON "Category"("isActive", "sortOrder");

CREATE UNIQUE INDEX "VehicleBrand_slug_key" ON "VehicleBrand"("slug");
CREATE INDEX "VehicleBrand_isActive_sortOrder_idx" ON "VehicleBrand"("isActive", "sortOrder");

CREATE INDEX "VehicleModel_brandId_isActive_idx" ON "VehicleModel"("brandId", "isActive");
CREATE UNIQUE INDEX "VehicleModel_brandId_slug_key" ON "VehicleModel"("brandId", "slug");

CREATE INDEX "VehicleGeneration_modelId_isActive_idx" ON "VehicleGeneration"("modelId", "isActive");
CREATE UNIQUE INDEX "VehicleGeneration_modelId_slug_key" ON "VehicleGeneration"("modelId", "slug");

CREATE INDEX "VehicleModification_generationId_idx" ON "VehicleModification"("generationId");
CREATE INDEX "VehicleModification_engineCode_idx" ON "VehicleModification"("engineCode");

CREATE UNIQUE INDEX "PartBrand_slug_key" ON "PartBrand"("slug");
CREATE INDEX "PartBrand_isActive_idx" ON "PartBrand"("isActive");

CREATE UNIQUE INDEX "Product_slug_key" ON "Product"("slug");
CREATE INDEX "Product_categoryId_status_idx" ON "Product"("categoryId", "status");
CREATE INDEX "Product_partBrandId_idx" ON "Product"("partBrandId");
CREATE INDEX "Product_articleNormalized_idx" ON "Product"("articleNormalized");
CREATE INDEX "Product_status_idx" ON "Product"("status");

CREATE INDEX "ProductIdentifier_normalizedValue_idx" ON "ProductIdentifier"("normalizedValue");
CREATE INDEX "ProductIdentifier_type_normalizedValue_idx" ON "ProductIdentifier"("type", "normalizedValue");
CREATE UNIQUE INDEX "ProductIdentifier_productId_type_normalizedValue_key" ON "ProductIdentifier"("productId", "type", "normalizedValue");

CREATE INDEX "ProductImage_productId_sortOrder_idx" ON "ProductImage"("productId", "sortOrder");

CREATE INDEX "ProductCompatibility_vehicleModificationId_confidence_idx" ON "ProductCompatibility"("vehicleModificationId", "confidence");
CREATE INDEX "ProductCompatibility_productId_confidence_idx" ON "ProductCompatibility"("productId", "confidence");
CREATE UNIQUE INDEX "ProductCompatibility_productId_vehicleModificationId_key" ON "ProductCompatibility"("productId", "vehicleModificationId");

CREATE UNIQUE INDEX "Supplier_code_key" ON "Supplier"("code");
CREATE UNIQUE INDEX "Warehouse_code_key" ON "Warehouse"("code");
CREATE INDEX "Warehouse_supplierId_idx" ON "Warehouse"("supplierId");

CREATE INDEX "ProductOffer_productId_availabilityStatus_idx" ON "ProductOffer"("productId", "availabilityStatus");
CREATE INDEX "ProductOffer_supplierId_idx" ON "ProductOffer"("supplierId");
CREATE INDEX "ProductOffer_warehouseId_idx" ON "ProductOffer"("warehouseId");

CREATE INDEX "VinRequest_status_createdAt_idx" ON "VinRequest"("status", "createdAt");
CREATE INDEX "VinRequest_vin_idx" ON "VinRequest"("vin");

CREATE UNIQUE INDEX "Order_number_key" ON "Order"("number");
CREATE UNIQUE INDEX "Order_accessToken_key" ON "Order"("accessToken");
CREATE INDEX "Order_status_createdAt_idx" ON "Order"("status", "createdAt");

CREATE INDEX "OrderItem_orderId_idx" ON "OrderItem"("orderId");
CREATE INDEX "OrderItem_productId_idx" ON "OrderItem"("productId");

CREATE INDEX "Lead_type_status_createdAt_idx" ON "Lead"("type", "status", "createdAt");

CREATE UNIQUE INDEX "SeoMetadata_entityType_entityId_key" ON "SeoMetadata"("entityType", "entityId");

CREATE INDEX "Product_name_trgm_idx" ON "Product" USING GIN ("name" gin_trgm_ops);
CREATE INDEX "ProductIdentifier_normalizedValue_trgm_idx" ON "ProductIdentifier" USING GIN ("normalizedValue" gin_trgm_ops);

ALTER TABLE "Category" ADD CONSTRAINT "Category_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleModel" ADD CONSTRAINT "VehicleModel_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "VehicleBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleGeneration" ADD CONSTRAINT "VehicleGeneration_modelId_fkey" FOREIGN KEY ("modelId") REFERENCES "VehicleModel"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "VehicleModification" ADD CONSTRAINT "VehicleModification_generationId_fkey" FOREIGN KEY ("generationId") REFERENCES "VehicleGeneration"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Product" ADD CONSTRAINT "Product_partBrandId_fkey" FOREIGN KEY ("partBrandId") REFERENCES "PartBrand"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductIdentifier" ADD CONSTRAINT "ProductIdentifier_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductIdentifier" ADD CONSTRAINT "ProductIdentifier_brandId_fkey" FOREIGN KEY ("brandId") REFERENCES "PartBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ProductImage" ADD CONSTRAINT "ProductImage_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCompatibility" ADD CONSTRAINT "ProductCompatibility_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductCompatibility" ADD CONSTRAINT "ProductCompatibility_vehicleModificationId_fkey" FOREIGN KEY ("vehicleModificationId") REFERENCES "VehicleModification"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Warehouse" ADD CONSTRAINT "Warehouse_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE SET NULL ON UPDATE CASCADE;
