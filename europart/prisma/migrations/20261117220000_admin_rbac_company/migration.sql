-- Admin panel: staff RBAC, company settings (publish gate), redirect stubs.

CREATE TYPE "AdminRole" AS ENUM (
  'SUPER_ADMIN',
  'ADMIN',
  'MANAGER',
  'WAREHOUSE_MANAGER',
  'SEO_MANAGER',
  'B2B_MANAGER'
);

CREATE TABLE "StaffUser" (
    "id" UUID NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "AdminRole" NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "StaffUser_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "StaffUser_email_key" ON "StaffUser"("email");
CREATE INDEX "StaffUser_role_isActive_idx" ON "StaffUser"("role", "isActive");

CREATE TABLE "CompanySettings" (
    "id" UUID NOT NULL,
    "orgName" TEXT,
    "legalName" TEXT,
    "unp" TEXT,
    "legalAddress" TEXT,
    "actualAddress" TEXT,
    "phones" TEXT,
    "email" TEXT,
    "hours" TEXT,
    "publishToStorefront" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "CompanySettings_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RedirectRule" (
    "id" UUID NOT NULL,
    "fromPath" TEXT NOT NULL,
    "toPath" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "RedirectRule_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "RedirectRule_fromPath_key" ON "RedirectRule"("fromPath");
CREATE INDEX "RedirectRule_isActive_idx" ON "RedirectRule"("isActive");
