"use client";

import { useActionState } from "react";
import { buttonClassName } from "@/components/ui/button";
import { controlClassName, Field } from "@/components/ui/field";
import { createRedirectAction } from "@/modules/admin/redirect-action";

export function RedirectForm() {
  const [state, action, pending] = useActionState(createRedirectAction, {
    error: null,
    ok: false,
  });

  return (
    <form action={action} className="grid max-w-xl gap-4 rounded-2xl border border-line bg-surface p-5">
      <Field htmlFor="fromPath" label="From path">
        <input
          className={controlClassName}
          id="fromPath"
          name="fromPath"
          placeholder="/old"
          required
          type="text"
        />
      </Field>
      <Field htmlFor="toPath" label="To path">
        <input
          className={controlClassName}
          id="toPath"
          name="toPath"
          placeholder="/new"
          required
          type="text"
        />
      </Field>
      <Field htmlFor="note" label="Note">
        <input className={controlClassName} id="note" name="note" type="text" />
      </Field>
      {state.error ? (
        <p className="text-sm text-danger" role="alert">
          {state.error}
        </p>
      ) : null}
      {state.ok ? (
        <p className="text-sm text-ink-muted" role="status">
          Правило добавлено (движок редиректов — позже).
        </p>
      ) : null}
      <button className={buttonClassName("primary")} disabled={pending} type="submit">
        {pending ? "Сохраняем…" : "Добавить"}
      </button>
    </form>
  );
}
