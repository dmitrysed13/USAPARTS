-- CreateTable
CREATE TABLE "SeoLandingContent" (
    "slug" TEXT NOT NULL,
    "h1" TEXT,
    "title" TEXT,
    "description" TEXT,
    "intro" TEXT,
    "body" TEXT,
    "faq" JSONB,
    "canonicalPath" TEXT,
    "indexable" BOOLEAN,
    "published" BOOLEAN NOT NULL DEFAULT true,
    "relatedProductSlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "relatedCategorySlugs" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,

    CONSTRAINT "SeoLandingContent_pkey" PRIMARY KEY ("slug")
);
