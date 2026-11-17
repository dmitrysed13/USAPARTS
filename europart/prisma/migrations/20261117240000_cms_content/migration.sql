-- CMS / content / GEO (final-spec §9): editorial documents, images, related products.
-- Empty CMS is intentional — no auto-spam seed.

CREATE TYPE "ContentStatus" AS ENUM ('DRAFT', 'PUBLISHED', 'ARCHIVED');

CREATE TYPE "ContentKind" AS ENUM (
  'ARTICLE',
  'GUIDE',
  'FAQ',
  'REVIEW',
  'CATEGORY_CONTENT',
  'VEHICLE_CONTENT'
);

ALTER TYPE "SeoEntityType" ADD VALUE IF NOT EXISTS 'CMS_DOCUMENT';

CREATE TABLE "CmsDocument" (
    "id" UUID NOT NULL,
    "kind" "ContentKind" NOT NULL,
    "status" "ContentStatus" NOT NULL DEFAULT 'DRAFT',
    "slug" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "excerpt" TEXT,
    "body" TEXT NOT NULL,
    "coverImageUrl" TEXT,
    "authorName" TEXT,
    "authorStaffId" UUID,
    "publishedAt" TIMESTAMPTZ(3),
    "reviewConfirmed" BOOLEAN NOT NULL DEFAULT false,
    "categoryId" UUID,
    "vehicleBrandId" UUID,
    "vehicleModelId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "CmsDocument_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CmsDocument_kind_slug_key" ON "CmsDocument"("kind", "slug");
CREATE INDEX "CmsDocument_status_kind_publishedAt_idx" ON "CmsDocument"("status", "kind", "publishedAt");
CREATE INDEX "CmsDocument_categoryId_status_idx" ON "CmsDocument"("categoryId", "status");
CREATE INDEX "CmsDocument_vehicleBrandId_status_idx" ON "CmsDocument"("vehicleBrandId", "status");
CREATE INDEX "CmsDocument_vehicleModelId_status_idx" ON "CmsDocument"("vehicleModelId", "status");

ALTER TABLE "CmsDocument"
  ADD CONSTRAINT "CmsDocument_authorStaffId_fkey"
  FOREIGN KEY ("authorStaffId") REFERENCES "StaffUser"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CmsDocument"
  ADD CONSTRAINT "CmsDocument_categoryId_fkey"
  FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CmsDocument"
  ADD CONSTRAINT "CmsDocument_vehicleBrandId_fkey"
  FOREIGN KEY ("vehicleBrandId") REFERENCES "VehicleBrand"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "CmsDocument"
  ADD CONSTRAINT "CmsDocument_vehicleModelId_fkey"
  FOREIGN KEY ("vehicleModelId") REFERENCES "VehicleModel"("id") ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "CmsDocumentImage" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "url" TEXT NOT NULL,
    "alt" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CmsDocumentImage_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CmsDocumentImage_documentId_sortOrder_idx" ON "CmsDocumentImage"("documentId", "sortOrder");

ALTER TABLE "CmsDocumentImage"
  ADD CONSTRAINT "CmsDocumentImage_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "CmsDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "CmsDocumentProduct" (
    "id" UUID NOT NULL,
    "documentId" UUID NOT NULL,
    "productId" UUID NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CmsDocumentProduct_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "CmsDocumentProduct_documentId_productId_key" ON "CmsDocumentProduct"("documentId", "productId");
CREATE INDEX "CmsDocumentProduct_productId_idx" ON "CmsDocumentProduct"("productId");
CREATE INDEX "CmsDocumentProduct_documentId_sortOrder_idx" ON "CmsDocumentProduct"("documentId", "sortOrder");

ALTER TABLE "CmsDocumentProduct"
  ADD CONSTRAINT "CmsDocumentProduct_documentId_fkey"
  FOREIGN KEY ("documentId") REFERENCES "CmsDocument"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CmsDocumentProduct"
  ADD CONSTRAINT "CmsDocumentProduct_productId_fkey"
  FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE;
