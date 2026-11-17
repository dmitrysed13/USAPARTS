import "server-only";

import type {
  ContentKind,
  ContentStatus,
  SeoRobotsMode,
} from "@/generated/prisma/client";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";
import { slugify } from "@/lib/slug";
import { publicSlugSchema } from "@/modules/catalog/slugs";
import { hasUsefulBody } from "@/modules/content/body";
import {
  isContentKind,
  isContentStatus,
} from "@/modules/content/labels";
import { cmsPublicPath, hasStandalonePublicPage } from "@/modules/content/paths";

const documentInclude = {
  images: { orderBy: { sortOrder: "asc" as const } },
  relatedProducts: {
    orderBy: { sortOrder: "asc" as const },
    include: {
      product: {
        select: {
          id: true,
          slug: true,
          name: true,
          status: true,
          article: true,
        },
      },
    },
  },
  category: { select: { id: true, name: true, slug: true } },
  vehicleBrand: { select: { id: true, name: true, slug: true } },
  vehicleModel: { select: { id: true, name: true, slug: true, brandId: true } },
  authorStaff: { select: { id: true, name: true, email: true } },
} as const;

export type CmsDocumentRow = Awaited<ReturnType<typeof listCmsDocuments>>[number];

function normalizeSlug(input: string | undefined, title: string): string {
  const raw = input?.trim() || slugify(title, "material");
  const parsed = publicSlugSchema.safeParse(raw);
  if (!parsed.success) {
    throw new Error("Слаг: только латиница, цифры и дефисы (до 120 символов).");
  }
  return parsed.data;
}

function parseProductIds(raw: string | string[] | undefined): string[] {
  if (!raw) {
    return [];
  }
  const values = Array.isArray(raw) ? raw : raw.split(/[\s,]+/);
  return [
    ...new Set(
      values
        .map((value) => value.trim())
        .filter((value) => /^[0-9a-f-]{36}$/i.test(value)),
    ),
  ].slice(0, 30);
}

function parseImageLines(raw: string | undefined): Array<{ url: string; alt: string | null }> {
  if (!raw?.trim()) {
    return [];
  }
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, 20)
    .map((line) => {
      const [url, ...altParts] = line.split("|");
      const href = url?.trim() ?? "";
      if (!href.startsWith("http://") && !href.startsWith("https://") && !href.startsWith("/")) {
        throw new Error("URL изображения должен начинаться с http(s):// или /.");
      }
      const alt = altParts.join("|").trim() || null;
      return { url: href.slice(0, 1000), alt: alt?.slice(0, 200) ?? null };
    });
}

export type CmsDocumentInput = {
  kind: ContentKind;
  status?: ContentStatus;
  slug?: string;
  title: string;
  excerpt?: string | null;
  body: string;
  coverImageUrl?: string | null;
  authorName?: string | null;
  authorStaffId?: string | null;
  reviewConfirmed?: boolean;
  categoryId?: string | null;
  vehicleBrandId?: string | null;
  vehicleModelId?: string | null;
  relatedProductIds?: string[] | string;
  imageLines?: string;
  seo?: {
    title?: string | null;
    description?: string | null;
    h1?: string | null;
    robotsMode?: SeoRobotsMode;
    ogImageUrl?: string | null;
  };
};

export function parseCmsDocumentInput(raw: Record<string, unknown>): CmsDocumentInput {
  const kindRaw = String(raw.kind ?? "");
  if (!isContentKind(kindRaw)) {
    throw new Error("Неизвестный тип материала.");
  }
  const statusRaw = raw.status != null ? String(raw.status) : "DRAFT";
  if (!isContentStatus(statusRaw)) {
    throw new Error("Неизвестный статус.");
  }
  const title = String(raw.title ?? "").trim();
  if (!title || title.length > 200) {
    throw new Error("Заголовок обязателен (до 200 символов).");
  }
  const body = String(raw.body ?? "").trim();
  if (!body) {
    throw new Error("Текст материала обязателен.");
  }
  if (statusRaw === "PUBLISHED" && !hasUsefulBody(body)) {
    throw new Error("Для публикации нужен осмысленный текст (≥ 20 символов).");
  }
  if (kindRaw === "REVIEW" && statusRaw === "PUBLISHED" && raw.reviewConfirmed !== true && raw.reviewConfirmed !== "on" && raw.reviewConfirmed !== "true") {
    throw new Error("Отзыв публикуется только после подтверждения (reviewConfirmed).");
  }
  if (kindRaw === "CATEGORY_CONTENT" && !String(raw.categoryId ?? "").trim()) {
    throw new Error("Контент категории требует categoryId.");
  }
  if (kindRaw === "VEHICLE_CONTENT") {
    const brandId = String(raw.vehicleBrandId ?? "").trim();
    const modelId = String(raw.vehicleModelId ?? "").trim();
    if (!brandId && !modelId) {
      throw new Error("Контент автомобиля требует vehicleBrandId или vehicleModelId.");
    }
  }

  let robotsMode: SeoRobotsMode | undefined;
  if (raw.seoRobotsMode != null && String(raw.seoRobotsMode).trim()) {
    const mode = String(raw.seoRobotsMode);
    if (mode !== "AUTO" && mode !== "INDEX" && mode !== "NOINDEX") {
      throw new Error("Некорректный robotsMode.");
    }
    robotsMode = mode;
  }

  return {
    kind: kindRaw,
    status: statusRaw,
    slug: raw.slug != null ? String(raw.slug) : undefined,
    title,
    excerpt: raw.excerpt != null ? String(raw.excerpt).trim().slice(0, 500) || null : null,
    body: body.slice(0, 100_000),
    coverImageUrl:
      raw.coverImageUrl != null
        ? String(raw.coverImageUrl).trim().slice(0, 1000) || null
        : null,
    authorName:
      raw.authorName != null ? String(raw.authorName).trim().slice(0, 120) || null : null,
    authorStaffId:
      raw.authorStaffId != null && String(raw.authorStaffId).trim()
        ? String(raw.authorStaffId).trim()
        : null,
    reviewConfirmed:
      raw.reviewConfirmed === true ||
      raw.reviewConfirmed === "on" ||
      raw.reviewConfirmed === "true",
    categoryId:
      raw.categoryId != null && String(raw.categoryId).trim()
        ? String(raw.categoryId).trim()
        : null,
    vehicleBrandId:
      raw.vehicleBrandId != null && String(raw.vehicleBrandId).trim()
        ? String(raw.vehicleBrandId).trim()
        : null,
    vehicleModelId:
      raw.vehicleModelId != null && String(raw.vehicleModelId).trim()
        ? String(raw.vehicleModelId).trim()
        : null,
    relatedProductIds: parseProductIds(
      raw.relatedProductIds as string | string[] | undefined,
    ),
    imageLines: raw.imageLines != null ? String(raw.imageLines) : undefined,
    seo: {
      title: raw.seoTitle != null ? String(raw.seoTitle).trim().slice(0, 200) || null : null,
      description:
        raw.seoDescription != null
          ? String(raw.seoDescription).trim().slice(0, 500) || null
          : null,
      h1: raw.seoH1 != null ? String(raw.seoH1).trim().slice(0, 200) || null : null,
      robotsMode,
      ogImageUrl:
        raw.seoOgImageUrl != null
          ? String(raw.seoOgImageUrl).trim().slice(0, 1000) || null
          : null,
    },
  };
}

async function syncRelated(
  documentId: string,
  productIds: string[],
  images: Array<{ url: string; alt: string | null }>,
) {
  const prisma = getPrismaClient();
  await prisma.cmsDocumentProduct.deleteMany({ where: { documentId } });
  await prisma.cmsDocumentImage.deleteMany({ where: { documentId } });
  if (productIds.length > 0) {
    const existing = await prisma.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true },
    });
    const ok = new Set(existing.map((row) => row.id));
    const ordered = productIds.filter((id) => ok.has(id));
    if (ordered.length > 0) {
      await prisma.cmsDocumentProduct.createMany({
        data: ordered.map((productId, sortOrder) => ({
          documentId,
          productId,
          sortOrder,
        })),
      });
    }
  }
  if (images.length > 0) {
    await prisma.cmsDocumentImage.createMany({
      data: images.map((image, sortOrder) => ({
        documentId,
        url: image.url,
        alt: image.alt,
        sortOrder,
      })),
    });
  }
}

async function upsertSeoForDocument(
  documentId: string,
  kind: ContentKind,
  slug: string,
  seo: CmsDocumentInput["seo"],
  fallback: { title: string; description: string | null },
) {
  if (!seo) {
    return;
  }
  const path = cmsPublicPath(kind, slug);
  const hasAny =
    seo.title ||
    seo.description ||
    seo.h1 ||
    seo.ogImageUrl ||
    (seo.robotsMode && seo.robotsMode !== "AUTO");
  if (!hasAny && !hasStandalonePublicPage(kind)) {
    return;
  }
  await getPrismaClient().seoMetadata.upsert({
    where: {
      entityType_entityId: { entityType: "CMS_DOCUMENT", entityId: documentId },
    },
    create: {
      entityType: "CMS_DOCUMENT",
      entityId: documentId,
      title: seo.title ?? fallback.title,
      description: seo.description ?? fallback.description,
      h1: seo.h1 ?? fallback.title,
      canonicalPath: path && !path.includes("#") ? path : null,
      robotsMode: seo.robotsMode ?? "AUTO",
      ogImageUrl: seo.ogImageUrl ?? null,
    },
    update: {
      title: seo.title,
      description: seo.description,
      h1: seo.h1,
      canonicalPath: path && !path.includes("#") ? path : null,
      robotsMode: seo.robotsMode ?? "AUTO",
      ogImageUrl: seo.ogImageUrl,
    },
  });
}

export async function listCmsDocuments(filter?: {
  kind?: ContentKind;
  status?: ContentStatus;
}) {
  return withDatabase(() =>
    getPrismaClient().cmsDocument.findMany({
      where: {
        ...(filter?.kind ? { kind: filter.kind } : {}),
        ...(filter?.status ? { status: filter.status } : {}),
      },
      orderBy: [{ updatedAt: "desc" }],
      take: 200,
      include: documentInclude,
    }),
  );
}

export async function getCmsDocumentById(id: string) {
  return withDatabase(() =>
    getPrismaClient().cmsDocument.findUnique({
      where: { id },
      include: documentInclude,
    }),
  );
}

export async function createCmsDocument(input: CmsDocumentInput) {
  const slug = normalizeSlug(input.slug, input.title);
  const images = parseImageLines(input.imageLines);
  const productIds = parseProductIds(input.relatedProductIds);
  const status = input.status ?? "DRAFT";
  const publishedAt = status === "PUBLISHED" ? new Date() : null;

  return withDatabase(async () => {
    const prisma = getPrismaClient();
    const row = await prisma.cmsDocument.create({
      data: {
        kind: input.kind,
        status,
        slug,
        title: input.title,
        excerpt: input.excerpt ?? null,
        body: input.body,
        coverImageUrl: input.coverImageUrl ?? null,
        authorName: input.authorName ?? null,
        authorStaffId: input.authorStaffId ?? null,
        publishedAt,
        reviewConfirmed: input.kind === "REVIEW" ? Boolean(input.reviewConfirmed) : false,
        categoryId: input.kind === "CATEGORY_CONTENT" ? input.categoryId : null,
        vehicleBrandId: input.kind === "VEHICLE_CONTENT" ? input.vehicleBrandId : null,
        vehicleModelId: input.kind === "VEHICLE_CONTENT" ? input.vehicleModelId : null,
      },
    });
    await syncRelated(row.id, productIds, images);
    await upsertSeoForDocument(row.id, input.kind, slug, input.seo, {
      title: input.title,
      description: input.excerpt ?? null,
    });
    return getCmsDocumentById(row.id);
  });
}

export async function updateCmsDocument(id: string, input: CmsDocumentInput) {
  const existing = await getCmsDocumentById(id);
  if (!existing) {
    throw new Error("Материал не найден.");
  }
  const slug = normalizeSlug(input.slug ?? existing.slug, input.title);
  const images = parseImageLines(input.imageLines);
  const productIds = parseProductIds(input.relatedProductIds);
  const status = input.status ?? existing.status;
  let publishedAt = existing.publishedAt;
  if (status === "PUBLISHED" && !publishedAt) {
    publishedAt = new Date();
  }
  if (status !== "PUBLISHED") {
    publishedAt = status === "DRAFT" ? null : existing.publishedAt;
  }

  return withDatabase(async () => {
    const prisma = getPrismaClient();
    await prisma.cmsDocument.update({
      where: { id },
      data: {
        kind: input.kind,
        status,
        slug,
        title: input.title,
        excerpt: input.excerpt ?? null,
        body: input.body,
        coverImageUrl: input.coverImageUrl ?? null,
        authorName: input.authorName ?? null,
        authorStaffId: input.authorStaffId ?? null,
        publishedAt,
        reviewConfirmed: input.kind === "REVIEW" ? Boolean(input.reviewConfirmed) : false,
        categoryId: input.kind === "CATEGORY_CONTENT" ? input.categoryId : null,
        vehicleBrandId: input.kind === "VEHICLE_CONTENT" ? input.vehicleBrandId : null,
        vehicleModelId: input.kind === "VEHICLE_CONTENT" ? input.vehicleModelId : null,
      },
    });
    await syncRelated(id, productIds, images);
    await upsertSeoForDocument(id, input.kind, slug, input.seo, {
      title: input.title,
      description: input.excerpt ?? null,
    });
    return getCmsDocumentById(id);
  });
}
