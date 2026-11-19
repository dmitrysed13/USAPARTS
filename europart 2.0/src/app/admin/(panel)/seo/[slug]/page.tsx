import { connection } from "next/server";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonClassName } from "@/components/ui/button";
import { Field, controlClassName } from "@/components/ui/field";
import { readLandingEditor } from "@/modules/admin/landing-content";

export default async function SeoLandingEditorPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  const editor = await readLandingEditor(slug);
  if (!editor) {
    notFound();
  }
  const { values, definition } = editor;
  return (
    <div className="grid max-w-3xl gap-6">
      <div>
        <Link className="text-sm text-ink-muted hover:text-brand" href="/admin/seo">
          Все посадочные
        </Link>
        <h1 className="mt-2 font-display text-3xl font-semibold">{definition.h1}</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Запросы: {definition.queries.join(", ")}. Правило индексации:{" "}
          {definition.policy === "needs-products"
            ? "только при опубликованном товаре этого отбора"
            : "редакционная страница"}
          .
        </p>
      </div>
      <form
        action={`/api/admin/seo/${definition.slug}`}
        className="grid gap-4"
        method="post"
      >
        <Field htmlFor="seo-h1" label="H1">
          <input
            className={controlClassName}
            defaultValue={values.h1}
            id="seo-h1"
            name="h1"
            required
          />
        </Field>
        <Field htmlFor="seo-title" label="Title без бренда">
          <input
            className={controlClassName}
            defaultValue={values.title}
            id="seo-title"
            name="title"
            required
          />
        </Field>
        <Field htmlFor="seo-description" label="Description">
          <textarea
            className={`${controlClassName} h-28 py-3`}
            defaultValue={values.description}
            id="seo-description"
            name="description"
            required
            rows={3}
          />
        </Field>
        <Field htmlFor="seo-intro" label="Вступление">
          <textarea
            className={`${controlClassName} h-28 py-3`}
            defaultValue={values.intro}
            id="seo-intro"
            name="intro"
            required
            rows={4}
          />
        </Field>
        <Field htmlFor="seo-body" label="Текст">
          <textarea
            className={`${controlClassName} h-28 py-3`}
            defaultValue={values.body}
            id="seo-body"
            name="body"
            required
            rows={8}
          />
        </Field>
        <Field
          hint="Вопрос на первой строке, ответ ниже. Блоки разделяйте пустой строкой."
          htmlFor="seo-faq"
          label="FAQ"
        >
          <textarea
            className={`${controlClassName} h-28 py-3`}
            defaultValue={values.faqText}
            id="seo-faq"
            name="faqText"
            required
            rows={12}
          />
        </Field>
        <Field htmlFor="seo-canonical" label="Canonical">
          <input
            className={controlClassName}
            defaultValue={values.canonicalPath}
            id="seo-canonical"
            name="canonicalPath"
            required
          />
        </Field>
        <Field htmlFor="seo-index" label="Индексация">
          <select
            className={controlClassName}
            defaultValue={values.indexable}
            id="seo-index"
            name="indexable"
          >
            <option value="inherit">По правилу страницы</option>
            <option value="yes">Открыть, если правило позволяет</option>
            <option value="no">Закрыть</option>
          </select>
        </Field>
        <Field htmlFor="seo-published" label="Публикация">
          <select
            className={controlClassName}
            defaultValue={values.published}
            id="seo-published"
            name="published"
          >
            <option value="yes">Показывать страницу</option>
            <option value="no">Скрыть, отдать 404</option>
          </select>
        </Field>
        <Field
          hint="Необязательно. Пусто — показать автоматический отбор."
          htmlFor="seo-products"
          label="Слаги товаров"
        >
          <textarea
            className={`${controlClassName} h-28 py-3`}
            defaultValue={values.relatedProductSlugs}
            id="seo-products"
            name="relatedProductSlugs"
            rows={3}
          />
        </Field>
        <Field
          hint="Необязательно. Пустая категория ссылкой не станет."
          htmlFor="seo-categories"
          label="Слаги категорий"
        >
          <textarea
            className={`${controlClassName} h-28 py-3`}
            defaultValue={values.relatedCategorySlugs}
            id="seo-categories"
            name="relatedCategorySlugs"
            rows={3}
          />
        </Field>
        <button className={buttonClassName()} name="action" type="submit" value="save">
          Сохранить
        </button>
      </form>
      <form action={`/api/admin/seo/${definition.slug}`} method="post">
        <button
          className={buttonClassName("secondary")}
          name="action"
          type="submit"
          value="reset"
        >
          Вернуть текст из кода
        </button>
      </form>
    </div>
  );
}
