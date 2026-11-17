"use client";

import { useActionState } from "react";
import { buttonClassName } from "@/components/ui/button";
import { controlClassName, Field } from "@/components/ui/field";
import { loginAdminAction } from "@/modules/admin/login-action";

export default function AdminLoginPage() {
  const [state, action, pending] = useActionState(loginAdminAction, { error: null });

  return (
    <div className="mx-auto flex min-h-screen max-w-md flex-col justify-center px-4 py-10">
      <div className="rounded-2xl border border-line bg-surface p-6 shadow-sm">
        <h1 className="font-display text-3xl font-semibold">Вход в админку</h1>
        <p className="mt-2 text-sm text-ink-muted">
          Роли проверяются на сервере. Первый Super Admin создаётся из{" "}
          <code>ADMIN_BOOTSTRAP_EMAIL</code> / <code>ADMIN_BOOTSTRAP_PASSWORD</code> (от 12
          символов), если сотрудников ещё нет.
        </p>
        <form action={action} className="mt-6 grid gap-4">
          <Field htmlFor="email" label="Email">
            <input
              autoComplete="username"
              className={controlClassName}
              id="email"
              name="email"
              required
              type="email"
            />
          </Field>
          <Field htmlFor="password" label="Пароль">
            <input
              autoComplete="current-password"
              className={controlClassName}
              id="password"
              name="password"
              required
              type="password"
            />
          </Field>
          {state.error ? (
            <p className="text-sm text-danger" role="alert">
              {state.error}
            </p>
          ) : null}
          <button className={buttonClassName("primary")} disabled={pending} type="submit">
            {pending ? "Входим…" : "Войти"}
          </button>
        </form>
      </div>
    </div>
  );
}
