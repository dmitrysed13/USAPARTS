import "server-only";

import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import { writeAudit } from "@/modules/admin/audit";
import {
  formatFaqText,
  fullTitle,
  getLanding,
  isLandingSlug,
  parseFaqText,
  type LandingSlug,
} from "@/modules/seo/landings";

const slugList = z.array(z.string().regex(/^[a-z0-9-]{1,80}$/)).max(12);

const formSchema = z
  .object({
    h1: z.string().trim().min(2).max(140),
    title: z.string().trim().min(2).max(70),
    description: z.string().trim().min(20).max(160),
    intro: z.string().trim().min(20).max(600),
    body: z.string().trim().min(20).max(4000),
    faqText: z.string().trim().min(3).max(8000),
    canonicalPath: z
      .string()
      .trim()
      .regex(/^\/[a-z0-9/-]*$/),
    indexable: z.enum(["inherit", "yes", "no"]),
    published: z.enum(["yes", "no"]),
    relatedProductSlugs: z.string().max(500),
    relatedCategorySlugs: z.string().max(500),
  })
  .superRefine((value, context) => {
    if (fullTitle(value.title).length > 70) {
      context.addIssue({
        code: "custom",
        path: ["title"],
        message: "Полный title длиннее 70 знаков.",
      });
    }
    if (value.canonicalPath.length > 120) {
      context.addIssue({
        code: "custom",
        path: ["canonicalPath"],
        message: "Canonical слишком длинный.",
      });
    }
  });

function splitSlugs(value: string): string[] {
  const items = value
    .split(/[\s,]+/)
    .map((item) => item.trim())
    .filter(Boolean);
  const parsed = slugList.safeParse(items);
  if (!parsed.success) {
    throw new Error("Слаги пишите латиницей, через пробел или запятую, не больше 12.");
  }
  return [...new Set(parsed.data)];
}

export async function readLandingEditor(slug: string) {
  if (!isLandingSlug(slug)) {
    return null;
  }
  const definition = getLanding(slug);
  if (!definition) {
    return null;
  }
  const saved = await getPrismaClient().seoLandingContent.findUnique({ where: { slug } });
  const faq = Array.isArray(saved?.faq) ? parseStoredFaq(saved.faq) : null;
  return {
    definition,
    saved,
    values: {
      h1: saved?.h1 || definition.h1,
      title: saved?.title || definition.title,
      description: saved?.description || definition.description,
      intro: saved?.intro || definition.intro,
      body: saved?.body || definition.body.join("\n\n"),
      faqText: formatFaqText(faq ?? definition.faq),
      canonicalPath: saved?.canonicalPath || definition.path,
      indexable:
        saved?.indexable === true ? "yes" : saved?.indexable === false ? "no" : "inherit",
      published: saved?.published === false ? "no" : "yes",
      relatedProductSlugs: (saved?.relatedProductSlugs ?? []).join("\n"),
      relatedCategorySlugs: (saved?.relatedCategorySlugs ?? []).join("\n"),
    },
  };
}

function parseStoredFaq(value: unknown) {
  if (!Array.isArray(value)) {
    return null;
  }
  const items = value.flatMap((item) => {
    if (!item || typeof item !== "object") {
      return [];
    }
    const question = "question" in item ? String(item.question) : "";
    const answer = "answer" in item ? String(item.answer) : "";
    return question && answer ? [{ question, answer }] : [];
  });
  return items.length > 0 ? items : null;
}

export async function saveLandingContent(slug: string, form: FormData) {
  if (!isLandingSlug(slug)) {
    throw new Error("Такой посадочной нет.");
  }
  const parsed = formSchema.safeParse({
    h1: text(form, "h1"),
    title: text(form, "title"),
    description: text(form, "description"),
    intro: text(form, "intro"),
    body: text(form, "body"),
    faqText: text(form, "faqText"),
    canonicalPath: text(form, "canonicalPath"),
    indexable: text(form, "indexable"),
    published: text(form, "published"),
    relatedProductSlugs: text(form, "relatedProductSlugs"),
    relatedCategorySlugs: text(form, "relatedCategorySlugs"),
  });
  if (!parsed.success) {
    throw new Error(parsed.error.issues[0]?.message ?? "Проверьте поля страницы.");
  }
  const faq = parseFaqText(parsed.data.faqText);
  if (faq.length === 0) {
    throw new Error("Добавьте хотя бы один вопрос и ответ.");
  }
  const data = {
    h1: parsed.data.h1,
    title: parsed.data.title,
    description: parsed.data.description,
    intro: parsed.data.intro,
    body: parsed.data.body,
    faq,
    canonicalPath: parsed.data.canonicalPath,
    indexable:
      parsed.data.indexable === "inherit" ? null : parsed.data.indexable === "yes",
    published: parsed.data.published === "yes",
    relatedProductSlugs: splitSlugs(parsed.data.relatedProductSlugs),
    relatedCategorySlugs: splitSlugs(parsed.data.relatedCategorySlugs),
  };
  const saved = await getPrismaClient().seoLandingContent.upsert({
    where: { slug },
    create: { slug, ...data },
    update: data,
  });
  await writeAudit({
    action: "seo.landing.update",
    entityType: "SeoLanding",
    entityId: slug,
    summary: `Обновлена посадочная /${slug}`,
    changes: { indexable: data.indexable, published: data.published },
  });
  return saved;
}

export async function resetLandingContent(slug: LandingSlug) {
  await getPrismaClient().seoLandingContent.deleteMany({ where: { slug } });
  await writeAudit({
    action: "seo.landing.reset",
    entityType: "SeoLanding",
    entityId: slug,
    summary: `Посадочная /${slug} возвращена к тексту в коде`,
  });
}

function text(form: FormData, key: string): string {
  const value = form.get(key);
  return typeof value === "string" ? value.trim() : "";
}
