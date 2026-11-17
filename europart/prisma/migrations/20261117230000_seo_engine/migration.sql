-- SEO engine: metadata extensions, semantic clusters, analytics settings.

CREATE TYPE "SeoRobotsMode" AS ENUM ('AUTO', 'INDEX', 'NOINDEX');

CREATE TYPE "SemanticClusterIntent" AS ENUM (
  'COMMERCIAL_BROAD',
  'COMMERCIAL_MID',
  'COMMERCIAL_NARROW',
  'INFORMATIONAL',
  'GEO',
  'B2B'
);

ALTER TABLE "SeoMetadata"
  ADD COLUMN "seoText" TEXT,
  ADD COLUMN "robotsMode" "SeoRobotsMode" NOT NULL DEFAULT 'AUTO',
  ADD COLUMN "ogImageUrl" TEXT;

CREATE TABLE "SemanticCluster" (
    "id" UUID NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "intent" "SemanticClusterIntent" NOT NULL,
    "targetPath" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "SemanticCluster_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SemanticCluster_slug_key" ON "SemanticCluster"("slug");
CREATE INDEX "SemanticCluster_intent_isActive_idx" ON "SemanticCluster"("intent", "isActive");

CREATE TABLE "SemanticClusterKeyword" (
    "id" UUID NOT NULL,
    "clusterId" UUID NOT NULL,
    "phrase" TEXT NOT NULL,
    "locale" TEXT NOT NULL DEFAULT 'ru',
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SemanticClusterKeyword_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "SemanticClusterKeyword_clusterId_phrase_key" ON "SemanticClusterKeyword"("clusterId", "phrase");
CREATE INDEX "SemanticClusterKeyword_phrase_idx" ON "SemanticClusterKeyword"("phrase");

ALTER TABLE "SemanticClusterKeyword"
  ADD CONSTRAINT "SemanticClusterKeyword_clusterId_fkey"
  FOREIGN KEY ("clusterId") REFERENCES "SemanticCluster"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE TABLE "SeoSettings" (
    "id" UUID NOT NULL,
    "indexingEnabled" BOOLEAN NOT NULL DEFAULT false,
    "ga4MeasurementId" TEXT,
    "gscVerification" TEXT,
    "yandexMetrikaId" TEXT,
    "yandexWebmasterVerification" TEXT,
    "googleMerchantId" TEXT,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "SeoSettings_pkey" PRIMARY KEY ("id")
);
