-- VIN lead history (status / comment trail). No VIN decode tables or fake decode data.

CREATE TABLE "VinRequestHistory" (
    "id" UUID NOT NULL,
    "vinRequestId" UUID NOT NULL,
    "fromStatus" "VinRequestStatus",
    "toStatus" "VinRequestStatus" NOT NULL,
    "comment" TEXT,
    "actor" TEXT NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "VinRequestHistory_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "VinRequestHistory_vinRequestId_createdAt_idx"
  ON "VinRequestHistory"("vinRequestId", "createdAt");

ALTER TABLE "VinRequestHistory"
  ADD CONSTRAINT "VinRequestHistory_vinRequestId_fkey"
  FOREIGN KEY ("vinRequestId") REFERENCES "VinRequest"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- Article search helpers (MPN / OEM normalized lookups use functional compares in SQL;
-- keep btree on raw columns for prefix scans where used).
CREATE INDEX IF NOT EXISTS "Product_mpn_idx" ON "Product"("mpn");
CREATE INDEX IF NOT EXISTS "Product_oem_idx" ON "Product"("oem");
