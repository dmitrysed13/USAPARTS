"use client";

import { useActionState } from "react";
import { buttonClassName } from "@/components/ui/button";
import { controlClassName, Field } from "@/components/ui/field";
import {
  createClusterAction,
  saveSeoSettingsAction,
} from "@/modules/seo/seo-action";
import { SEMANTIC_CLUSTER_INTENTS } from "@/modules/seo/cluster-intents";

export function SeoSettingsForm({
  initial,
  envIndexingEnabled,
}: {
  initial: {
    indexingEnabled: boolean;
    ga4MeasurementId: string;
    gscVerification: string;
    yandexMetrikaId: string;
    yandexWebmasterVerification: string;
    googleMerchantId: string;
  };
  envIndexingEnabled: boolean;
}) {
  const [state, action, pending] = useActionState(saveSeoSettingsAction, {
    error: null,
    ok: false,
  });

  return (
    <form action={action} className="grid max-w-2xl gap-4 rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-ink-muted">
        Публичная индексация требует <code>SEO_INDEXING_ENABLED=true</code> в env
        {envIndexingEnabled ? " (сейчас включено)" : " (сейчас выключено)"} и флаг ниже.
        ID аналитики: env перекрывает значения из формы. Пустые ID не подставляются.
      </p>
      <label className="flex items-start gap-3 text-sm">
        <input
          className="mt-1"
          defaultChecked={initial.indexingEnabled}
          name="indexingEnabled"
          type="checkbox"
        />
        <span>Разрешить индексацию качественных URL (admin gate)</span>
      </label>
      <Field htmlFor="ga4MeasurementId" label="GA4 Measurement ID">
        <input
          className={controlClassName}
          defaultValue={initial.ga4MeasurementId}
          id="ga4MeasurementId"
          name="ga4MeasurementId"
          placeholder="G-…"
          type="text"
        />
      </Field>
      <Field htmlFor="gscVerification" label="Google Search Console verification">
        <input
          className={controlClassName}
          defaultValue={initial.gscVerification}
          id="gscVerification"
          name="gscVerification"
          type="text"
        />
      </Field>
      <Field htmlFor="yandexMetrikaId" label="Yandex Metrika ID">
        <input
          className={controlClassName}
          defaultValue={initial.yandexMetrikaId}
          id="yandexMetrikaId"
          name="yandexMetrikaId"
          type="text"
        />
      </Field>
      <Field htmlFor="yandexWebmasterVerification" label="Yandex Webmaster verification">
        <input
          className={controlClassName}
          defaultValue={initial.yandexWebmasterVerification}
          id="yandexWebmasterVerification"
          name="yandexWebmasterVerification"
          type="text"
        />
      </Field>
      <Field htmlFor="googleMerchantId" label="Google Merchant ID">
        <input
          className={controlClassName}
          defaultValue={initial.googleMerchantId}
          id="googleMerchantId"
          name="googleMerchantId"
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
          Сохранено.
        </p>
      ) : null}
      <button className={buttonClassName("primary")} disabled={pending} type="submit">
        {pending ? "Сохраняем…" : "Сохранить настройки"}
      </button>
    </form>
  );
}

export function SemanticClusterForm() {
  const [state, action, pending] = useActionState(createClusterAction, {
    error: null,
    ok: false,
  });

  return (
    <form action={action} className="grid max-w-2xl gap-4 rounded-2xl border border-line bg-surface p-5">
      <p className="text-sm text-ink-muted">
        Кластеры хранят семантику. Страницы из кластеров <strong>не</strong> генерируются
        автоматически.
      </p>
      <Field htmlFor="name" label="Название">
        <input className={controlClassName} id="name" name="name" required type="text" />
      </Field>
      <Field htmlFor="slug" label="Slug (опционально)">
        <input className={controlClassName} id="slug" name="slug" type="text" />
      </Field>
      <Field htmlFor="intent" label="Intent">
        <select className={controlClassName} defaultValue="COMMERCIAL_MID" id="intent" name="intent">
          {SEMANTIC_CLUSTER_INTENTS.map((intent) => (
            <option key={intent} value={intent}>
              {intent}
            </option>
          ))}
        </select>
      </Field>
      <Field htmlFor="targetPath" label="Планируемый path (не создаёт страницу)">
        <input
          className={controlClassName}
          id="targetPath"
          name="targetPath"
          placeholder="/catalog/…"
          type="text"
        />
      </Field>
      <Field htmlFor="keywords" label="Ключи (по строке или через запятую)">
        <textarea className={controlClassName} id="keywords" name="keywords" rows={4} />
      </Field>
      <Field htmlFor="notes" label="Заметки">
        <textarea className={controlClassName} id="notes" name="notes" rows={2} />
      </Field>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-ink-muted" role="status">
          Кластер сохранён.
        </p>
      ) : null}
      <button className={buttonClassName("primary")} disabled={pending} type="submit">
        {pending ? "Создаём…" : "Добавить кластер"}
      </button>
    </form>
  );
}
