-- EUROPART 3.0 §5 — suppliers, offers, prices, warehouses, import, FX/markup.
-- Additive only. No seed / fake catalog rows.

CREATE TYPE "OfferStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'ARCHIVED');
CREATE TYPE "StockSourceKind" AS ENUM ('WAREHOUSE', 'SUPPLIER', 'ON_ORDER');
CREATE TYPE "SupplierImportFormat" AS ENUM ('CSV', 'XLSX', 'API', 'MANUAL');
CREATE TYPE "MarkupScope" AS ENUM ('GLOBAL', 'CATEGORY', 'SUPPLIER', 'PART_BRAND');
CREATE TYPE "MarkupType" AS ENUM ('PERCENT', 'FIXED');
CREATE TYPE "ImportJobStatus" AS ENUM ('UPLOADED', 'READY', 'COMMITTED', 'ROLLED_BACK', 'FAILED');
CREATE TYPE "ImportRowAction" AS ENUM ('CREATE', 'UPDATE', 'ERROR', 'DUPLICATE');
CREATE TYPE "SupplierSyncKind" AS ENUM ('PRODUCTS', 'PRICES', 'STOCK', 'FULL');
CREATE TYPE "SupplierSyncStatus" AS ENUM ('STARTED', 'SUCCESS', 'PARTIAL', 'FAILED');

ALTER TABLE "Product" ADD COLUMN "mpn" TEXT;

CREATE TABLE "ProductAttribute" (
    "id" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "key" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ProductAttribute_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Supplier"
    ADD COLUMN "email" TEXT,
    ADD COLUMN "phone" TEXT,
    ADD COLUMN "website" TEXT,
    ADD COLUMN "note" TEXT,
    ADD COLUMN "terms" TEXT,
    ADD COLUMN "currency" CHAR(3) NOT NULL DEFAULT 'EUR',
    ADD COLUMN "importFormat" "SupplierImportFormat" NOT NULL DEFAULT 'MANUAL',
    ADD COLUMN "apiEnabled" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "apiBaseUrl" TEXT,
    ADD COLUMN "credentialsEnvKey" TEXT;

ALTER TABLE "Warehouse"
    ADD COLUMN "address" TEXT,
    ADD COLUMN "isActive" BOOLEAN NOT NULL DEFAULT true,
    ADD COLUMN "stockUpdatedAt" TIMESTAMPTZ(3);

ALTER TABLE "ProductOffer"
    ADD COLUMN "externalId" TEXT,
    ADD COLUMN "condition" "ProductCondition" NOT NULL DEFAULT 'NEW',
    ADD COLUMN "status" "OfferStatus" NOT NULL DEFAULT 'ACTIVE',
    ADD COLUMN "purchaseCurrency" CHAR(3),
    ADD COLUMN "extrasAmount" DECIMAL(12,2),
    ADD COLUMN "stockSource" "StockSourceKind",
    ADD COLUMN "stockConfirmed" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "stockUpdatedAt" TIMESTAMPTZ(3);

CREATE TABLE "OfferPriceHistory" (
    "id" UUID NOT NULL,
    "offerId" UUID NOT NULL,
    "purchasePrice" DECIMAL(12,2),
    "purchaseCurrency" CHAR(3),
    "fxRate" DECIMAL(18,8),
    "markupType" "MarkupType",
    "markupValue" DECIMAL(12,4),
    "extrasAmount" DECIMAL(12,2),
    "retailPrice" DECIMAL(12,2),
    "b2bPrice" DECIMAL(12,2),
    "currency" CHAR(3) NOT NULL DEFAULT 'BYN',
    "source" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OfferPriceHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "FxRate" (
    "id" UUID NOT NULL,
    "baseCurrency" CHAR(3) NOT NULL,
    "quoteCurrency" CHAR(3) NOT NULL,
    "rate" DECIMAL(18,8) NOT NULL,
    "source" TEXT NOT NULL,
    "effectiveFrom" TIMESTAMPTZ(3) NOT NULL,
    "effectiveTo" TIMESTAMPTZ(3),
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "FxRate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MarkupRule" (
    "id" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "scope" "MarkupScope" NOT NULL,
    "categoryId" UUID,
    "supplierId" UUID,
    "partBrandId" UUID,
    "markupType" "MarkupType" NOT NULL,
    "value" DECIMAL(12,4) NOT NULL,
    "b2bValue" DECIMAL(12,4),
    "priority" INTEGER NOT NULL DEFAULT 100,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "MarkupRule_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportTemplate" (
    "id" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "name" TEXT NOT NULL,
    "mapping" JSONB NOT NULL,
    "options" JSONB NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "ImportTemplate_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportJob" (
    "id" UUID NOT NULL,
    "supplierId" UUID,
    "warehouseId" UUID,
    "templateId" UUID,
    "sourceType" "OfferSourceType" NOT NULL,
    "filename" TEXT NOT NULL,
    "status" "ImportJobStatus" NOT NULL DEFAULT 'UPLOADED',
    "headers" JSONB NOT NULL,
    "rawRows" JSONB NOT NULL,
    "mapping" JSONB,
    "summary" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "ImportJob_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "ImportRow" (
    "id" UUID NOT NULL,
    "jobId" UUID NOT NULL,
    "rowNumber" INTEGER NOT NULL,
    "normalized" JSONB NOT NULL,
    "action" "ImportRowAction" NOT NULL,
    "message" TEXT,
    "productId" UUID,
    "offerId" UUID,
    "snapshot" JSONB,
    "applied" BOOLEAN NOT NULL DEFAULT false,
    CONSTRAINT "ImportRow_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "SupplierSyncLog" (
    "id" UUID NOT NULL,
    "supplierId" UUID NOT NULL,
    "kind" "SupplierSyncKind" NOT NULL,
    "status" "SupplierSyncStatus" NOT NULL,
    "attempt" INTEGER NOT NULL DEFAULT 1,
    "itemsRead" INTEGER NOT NULL DEFAULT 0,
    "itemsWritten" INTEGER NOT NULL DEFAULT 0,
    "errorMessage" TEXT,
    "detail" JSONB,
    "startedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "finishedAt" TIMESTAMPTZ(3),
    CONSTRAINT "SupplierSyncLog_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "AuditLog" (
    "id" UUID NOT NULL,
    "actor" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "summary" TEXT NOT NULL,
    "changes" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "AuditLog_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Product_mpn_idx" ON "Product"("mpn");
CREATE UNIQUE INDEX "ProductAttribute_productId_key_key" ON "ProductAttribute"("productId", "key");
CREATE INDEX "ProductAttribute_productId_sortOrder_idx" ON "ProductAttribute"("productId", "sortOrder");
CREATE INDEX "Warehouse_isActive_type_idx" ON "Warehouse"("isActive", "type");
CREATE INDEX "ProductOffer_productId_status_idx" ON "ProductOffer"("productId", "status");
CREATE INDEX "ProductOffer_supplierId_externalId_idx" ON "ProductOffer"("supplierId", "externalId");
CREATE INDEX "ProductOffer_stockConfirmed_availabilityStatus_idx" ON "ProductOffer"("stockConfirmed", "availabilityStatus");
CREATE INDEX "OfferPriceHistory_offerId_createdAt_idx" ON "OfferPriceHistory"("offerId", "createdAt");
CREATE INDEX "FxRate_baseCurrency_quoteCurrency_effectiveFrom_idx" ON "FxRate"("baseCurrency", "quoteCurrency", "effectiveFrom");
CREATE INDEX "MarkupRule_scope_isActive_priority_idx" ON "MarkupRule"("scope", "isActive", "priority");
CREATE INDEX "MarkupRule_categoryId_idx" ON "MarkupRule"("categoryId");
CREATE INDEX "MarkupRule_supplierId_idx" ON "MarkupRule"("supplierId");
CREATE INDEX "MarkupRule_partBrandId_idx" ON "MarkupRule"("partBrandId");
CREATE INDEX "ImportTemplate_supplierId_idx" ON "ImportTemplate"("supplierId");
CREATE UNIQUE INDEX "ImportTemplate_supplierId_name_key" ON "ImportTemplate"("supplierId", "name");
CREATE INDEX "ImportJob_status_createdAt_idx" ON "ImportJob"("status", "createdAt");
CREATE INDEX "ImportJob_supplierId_idx" ON "ImportJob"("supplierId");
CREATE INDEX "ImportRow_jobId_action_idx" ON "ImportRow"("jobId", "action");
CREATE UNIQUE INDEX "ImportRow_jobId_rowNumber_key" ON "ImportRow"("jobId", "rowNumber");
CREATE INDEX "SupplierSyncLog_supplierId_startedAt_idx" ON "SupplierSyncLog"("supplierId", "startedAt");
CREATE INDEX "SupplierSyncLog_status_startedAt_idx" ON "SupplierSyncLog"("status", "startedAt");
CREATE INDEX "AuditLog_createdAt_idx" ON "AuditLog"("createdAt");
CREATE INDEX "AuditLog_entityType_entityId_idx" ON "AuditLog"("entityType", "entityId");

ALTER TABLE "ProductAttribute" ADD CONSTRAINT "ProductAttribute_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "OfferPriceHistory" ADD CONSTRAINT "OfferPriceHistory_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ProductOffer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "MarkupRule" ADD CONSTRAINT "MarkupRule_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "ImportTemplate" ADD CONSTRAINT "ImportTemplate_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Warehouse"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ImportJob" ADD CONSTRAINT "ImportJob_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ImportTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "ImportRow" ADD CONSTRAINT "ImportRow_jobId_fkey" FOREIGN KEY ("jobId") REFERENCES "ImportJob"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "SupplierSyncLog" ADD CONSTRAINT "SupplierSyncLog_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_quantity_nonneg" CHECK ("quantity" >= 0);
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_reserved_nonneg" CHECK ("reservedQuantity" >= 0);
ALTER TABLE "ProductOffer" ADD CONSTRAINT "ProductOffer_reserved_lte_quantity" CHECK ("reservedQuantity" <= "quantity");
ALTER TABLE "FxRate" ADD CONSTRAINT "FxRate_rate_positive" CHECK ("rate" > 0);
