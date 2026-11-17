"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { buttonClassName } from "@/components/ui/button";
import { controlClassName, Field } from "@/components/ui/field";
import {
  createCmsDocumentAction,
  updateCmsDocumentAction,
} from "@/modules/content/content-action";
import {
  CONTENT_KINDS,
  CONTENT_STATUSES,
  contentKindLabels,
  contentStatusLabels,
} from "@/modules/content/labels";

export type CmsDocumentFormValues = {
  id?: string;
  kind: string;
  status: string;
  slug: string;
  title: string;
  excerpt: string;
  body: string;
  coverImageUrl: string;
  authorName: string;
  reviewConfirmed: boolean;
  categoryId: string;
  vehicleBrandId: string;
  vehicleModelId: string;
  relatedProductIds: string;
  imageLines: string;
  seoTitle: string;
  seoDescription: string;
  seoH1: string;
  seoRobotsMode: string;
  seoOgImageUrl: string;
};

const emptyValues: CmsDocumentFormValues = {
  kind: "ARTICLE",
  status: "DRAFT",
  slug: "",
  title: "",
  excerpt: "",
  body: "",
  coverImageUrl: "",
  authorName: "",
  reviewConfirmed: false,
  categoryId: "",
  vehicleBrandId: "",
  vehicleModelId: "",
  relatedProductIds: "",
  imageLines: "",
  seoTitle: "",
  seoDescription: "",
  seoH1: "",
  seoRobotsMode: "AUTO",
  seoOgImageUrl: "",
};

export function CmsDocumentForm({
  mode,
  initial,
}: {
  mode: "create" | "edit";
  initial?: Partial<CmsDocumentFormValues>;
}) {
  const router = useRouter();
  const values = { ...emptyValues, ...initial };
  const action = mode === "create" ? createCmsDocumentAction : updateCmsDocumentAction;
  const [state, formAction, pending] = useActionState(action, {
    error: null,
    ok: false,
    id: null,
  });

  useEffect(() => {
    if (mode === "create" && state.ok && state.id) {
      router.push(`/admin/articles/${state.id}`);
    }
  }, [mode, state.ok, state.id, router]);

  return (
    <form action={formAction} className="grid max-w-3xl gap-4 rounded-2xl border border-line bg-surface p-5">
      {mode === "edit" && values.id ? (
        <input name="id" type="hidden" value={values.id} />
      ) : null}
      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor="kind" label="Тип">
          <select
            className={controlClassName}
            defaultValue={values.kind}
            id="kind"
            name="kind"
            required
          >
            {CONTENT_KINDS.map((kind) => (
              <option key={kind} value={kind}>
                {contentKindLabels[kind]}
              </option>
            ))}
          </select>
        </Field>
        <Field htmlFor="status" label="Статус">
          <select
            className={controlClassName}
            defaultValue={values.status}
            id="status"
            name="status"
            required
          >
            {CONTENT_STATUSES.map((status) => (
              <option key={status} value={status}>
                {contentStatusLabels[status]}
              </option>
            ))}
          </select>
        </Field>
      </div>
      <Field htmlFor="title" label="Заголовок">
        <input
          className={controlClassName}
          defaultValue={values.title}
          id="title"
          name="title"
          required
          type="text"
        />
      </Field>
      <Field
        hint="Латиница, цифры, дефисы. Пусто — из заголовка."
        htmlFor="slug"
        label="Slug"
      >
        <input
          className={controlClassName}
          defaultValue={values.slug}
          id="slug"
          name="slug"
          type="text"
        />
      </Field>
      <Field htmlFor="excerpt" label="Краткое описание">
        <textarea
          className={`${controlClassName} h-24 py-3`}
          defaultValue={values.excerpt}
          id="excerpt"
          name="excerpt"
        />
      </Field>
      <Field
        hint="Полезный уникальный текст. Для публикации ≥ 20 символов."
        htmlFor="body"
        label="Текст"
      >
        <textarea
          className={`${controlClassName} h-48 py-3`}
          defaultValue={values.body}
          id="body"
          name="body"
          required
        />
      </Field>
      <Field htmlFor="authorName" label="Автор">
        <input
          className={controlClassName}
          defaultValue={values.authorName}
          id="authorName"
          name="authorName"
          placeholder="Реальное имя редактора"
          type="text"
        />
      </Field>
      <Field htmlFor="coverImageUrl" label="Обложка (URL)">
        <input
          className={controlClassName}
          defaultValue={values.coverImageUrl}
          id="coverImageUrl"
          name="coverImageUrl"
          type="text"
        />
      </Field>
      <Field
        hint="По одной строке: url|alt"
        htmlFor="imageLines"
        label="Изображения"
      >
        <textarea
          className={`${controlClassName} h-24 py-3`}
          defaultValue={values.imageLines}
          id="imageLines"
          name="imageLines"
        />
      </Field>
      <Field
        hint="UUID товаров через запятую — только реальные related products."
        htmlFor="relatedProductIds"
        label="Related product IDs"
      >
        <input
          className={controlClassName}
          defaultValue={values.relatedProductIds}
          id="relatedProductIds"
          name="relatedProductIds"
          type="text"
        />
      </Field>
      <Field htmlFor="categoryId" label="categoryId (для контента категории)">
        <input
          className={controlClassName}
          defaultValue={values.categoryId}
          id="categoryId"
          name="categoryId"
          type="text"
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field htmlFor="vehicleBrandId" label="vehicleBrandId">
          <input
            className={controlClassName}
            defaultValue={values.vehicleBrandId}
            id="vehicleBrandId"
            name="vehicleBrandId"
            type="text"
          />
        </Field>
        <Field htmlFor="vehicleModelId" label="vehicleModelId">
          <input
            className={controlClassName}
            defaultValue={values.vehicleModelId}
            id="vehicleModelId"
            name="vehicleModelId"
            type="text"
          />
        </Field>
      </div>
      <label className="flex items-start gap-3 text-sm">
        <input
          className="mt-1"
          defaultChecked={values.reviewConfirmed}
          name="reviewConfirmed"
          type="checkbox"
        />
        <span>
          Подтвердить отзыв (обязательно для публикации REVIEW; без подтверждения
          на витрину не выходит)
        </span>
      </label>
      <h3 className="pt-2 font-display text-xl font-semibold">SEO metadata</h3>
      <Field htmlFor="seoTitle" label="SEO title">
        <input
          className={controlClassName}
          defaultValue={values.seoTitle}
          id="seoTitle"
          name="seoTitle"
          type="text"
        />
      </Field>
      <Field htmlFor="seoDescription" label="SEO description">
        <textarea
          className={`${controlClassName} h-20 py-3`}
          defaultValue={values.seoDescription}
          id="seoDescription"
          name="seoDescription"
        />
      </Field>
      <Field htmlFor="seoH1" label="SEO H1">
        <input
          className={controlClassName}
          defaultValue={values.seoH1}
          id="seoH1"
          name="seoH1"
          type="text"
        />
      </Field>
      <Field htmlFor="seoRobotsMode" label="robotsMode">
        <select
          className={controlClassName}
          defaultValue={values.seoRobotsMode}
          id="seoRobotsMode"
          name="seoRobotsMode"
        >
          <option value="AUTO">AUTO</option>
          <option value="INDEX">INDEX</option>
          <option value="NOINDEX">NOINDEX</option>
        </select>
      </Field>
      <Field htmlFor="seoOgImageUrl" label="OG image URL">
        <input
          className={controlClassName}
          defaultValue={values.seoOgImageUrl}
          id="seoOgImageUrl"
          name="seoOgImageUrl"
          type="text"
        />
      </Field>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-ink-muted" role="status">
          Сохранено. Черновики и пустой CMS допустимы — спам не генерируется.
        </p>
      ) : null}
      <button className={buttonClassName("primary")} disabled={pending} type="submit">
        {pending ? "Сохраняем…" : mode === "create" ? "Создать" : "Обновить"}
      </button>
    </form>
  );
}
