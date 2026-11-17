import type { ContentKind, ContentStatus } from "@/generated/prisma/client";

export const CONTENT_KINDS = [
  "ARTICLE",
  "GUIDE",
  "FAQ",
  "REVIEW",
  "CATEGORY_CONTENT",
  "VEHICLE_CONTENT",
] as const satisfies readonly ContentKind[];

export const CONTENT_STATUSES = [
  "DRAFT",
  "PUBLISHED",
  "ARCHIVED",
] as const satisfies readonly ContentStatus[];

export const contentKindLabels: Record<ContentKind, string> = {
  ARTICLE: "Статья",
  GUIDE: "Инструкция",
  FAQ: "FAQ",
  REVIEW: "Отзыв",
  CATEGORY_CONTENT: "Контент категории",
  VEHICLE_CONTENT: "Контент автомобиля",
};

export const contentStatusLabels: Record<ContentStatus, string> = {
  DRAFT: "Черновик",
  PUBLISHED: "Опубликовано",
  ARCHIVED: "Архив",
};

export function isContentKind(value: string): value is ContentKind {
  return (CONTENT_KINDS as readonly string[]).includes(value);
}

export function isContentStatus(value: string): value is ContentStatus {
  return (CONTENT_STATUSES as readonly string[]).includes(value);
}
