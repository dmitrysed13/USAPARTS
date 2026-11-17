-- Attribution fields for orders/leads (UTM + first/last source only — no PII).
ALTER TABLE "Order"
  ADD COLUMN "utmSource" TEXT,
  ADD COLUMN "utmMedium" TEXT,
  ADD COLUMN "utmCampaign" TEXT,
  ADD COLUMN "utmContent" TEXT,
  ADD COLUMN "utmTerm" TEXT,
  ADD COLUMN "firstTouchSource" TEXT,
  ADD COLUMN "lastTouchSource" TEXT,
  ADD COLUMN "attributionCapturedAt" TIMESTAMPTZ(3);

CREATE INDEX "Order_utmSource_createdAt_idx" ON "Order"("utmSource", "createdAt");
CREATE INDEX "Order_firstTouchSource_createdAt_idx" ON "Order"("firstTouchSource", "createdAt");
CREATE INDEX "Order_lastTouchSource_createdAt_idx" ON "Order"("lastTouchSource", "createdAt");

ALTER TABLE "Lead"
  ADD COLUMN "utmSource" TEXT,
  ADD COLUMN "utmMedium" TEXT,
  ADD COLUMN "utmCampaign" TEXT,
  ADD COLUMN "utmContent" TEXT,
  ADD COLUMN "utmTerm" TEXT,
  ADD COLUMN "firstTouchSource" TEXT,
  ADD COLUMN "lastTouchSource" TEXT,
  ADD COLUMN "attributionCapturedAt" TIMESTAMPTZ(3);

CREATE INDEX "Lead_utmSource_createdAt_idx" ON "Lead"("utmSource", "createdAt");
CREATE INDEX "Lead_firstTouchSource_createdAt_idx" ON "Lead"("firstTouchSource", "createdAt");
CREATE INDEX "Lead_lastTouchSource_createdAt_idx" ON "Lead"("lastTouchSource", "createdAt");
