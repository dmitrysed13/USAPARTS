"use client";

import { useActionState } from "react";
import { buttonClassName } from "@/components/ui/button";
import { controlClassName, Field } from "@/components/ui/field";
import { saveCompanySettingsAction } from "@/modules/admin/company-action";

export type CompanyFormValues = {
  orgName: string;
  legalName: string;
  unp: string;
  legalAddress: string;
  actualAddress: string;
  phones: string;
  email: string;
  hours: string;
  publishToStorefront: boolean;
};

export function CompanyForm({ initial }: { initial: CompanyFormValues }) {
  const [state, action, pending] = useActionState(saveCompanySettingsAction, {
    error: null,
    ok: false,
  });

  return (
    <form action={action} className="grid max-w-2xl gap-4 rounded-2xl border border-line bg-surface p-5">
      <Field htmlFor="orgName" label="Название организации">
        <input
          className={controlClassName}
          defaultValue={initial.orgName}
          id="orgName"
          name="orgName"
          type="text"
        />
      </Field>
      <Field htmlFor="legalName" label="Юридическое название">
        <input
          className={controlClassName}
          defaultValue={initial.legalName}
          id="legalName"
          name="legalName"
          type="text"
        />
      </Field>
      <Field htmlFor="unp" label="УНП">
        <input
          className={controlClassName}
          defaultValue={initial.unp}
          id="unp"
          name="unp"
          type="text"
        />
      </Field>
      <Field htmlFor="legalAddress" label="Юридический адрес">
        <input
          className={controlClassName}
          defaultValue={initial.legalAddress}
          id="legalAddress"
          name="legalAddress"
          type="text"
        />
      </Field>
      <Field htmlFor="actualAddress" label="Фактический адрес">
        <input
          className={controlClassName}
          defaultValue={initial.actualAddress}
          id="actualAddress"
          name="actualAddress"
          type="text"
        />
      </Field>
      <Field htmlFor="phones" label="Телефоны">
        <input
          className={controlClassName}
          defaultValue={initial.phones}
          id="phones"
          name="phones"
          placeholder="+375…"
          type="text"
        />
      </Field>
      <Field htmlFor="email" label="Email">
        <input
          className={controlClassName}
          defaultValue={initial.email}
          id="email"
          name="email"
          type="email"
        />
      </Field>
      <Field htmlFor="hours" label="Часы работы">
        <input
          className={controlClassName}
          defaultValue={initial.hours}
          id="hours"
          name="hours"
          type="text"
        />
      </Field>
      <label className="flex items-start gap-3 text-sm">
        <input
          className="mt-1"
          defaultChecked={initial.publishToStorefront}
          name="publishToStorefront"
          type="checkbox"
        />
        <span>
          Публиковать на витрину. Включается только при заполненных юр. названии, УНП,
          юр. адресе, телефонах и email — иначе сохранение с флагом отклоняется.
        </span>
      </label>
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
        {pending ? "Сохраняем…" : "Сохранить"}
      </button>
    </form>
  );
}
