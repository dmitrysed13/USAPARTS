"use client";

import { useActionState } from "react";
import { buttonClassName } from "@/components/ui/button";
import { controlClassName, Field } from "@/components/ui/field";
import { createStaffAction } from "@/modules/admin/staff-action";
import { ADMIN_ROLES, adminRoleLabels } from "@/modules/admin/roles";

export function StaffForm() {
  const [state, action, pending] = useActionState(createStaffAction, {
    error: null,
    ok: false,
  });

  return (
    <form action={action} className="grid max-w-xl gap-4 rounded-2xl border border-line bg-surface p-5">
      <Field htmlFor="name" label="Имя">
        <input className={controlClassName} id="name" name="name" required type="text" />
      </Field>
      <Field htmlFor="email" label="Email">
        <input className={controlClassName} id="email" name="email" required type="email" />
      </Field>
      <Field htmlFor="role" label="Роль">
        <select className={controlClassName} defaultValue="MANAGER" id="role" name="role">
          {ADMIN_ROLES.map((role) => (
            <option key={role} value={role}>
              {adminRoleLabels[role]}
            </option>
          ))}
        </select>
      </Field>
      <Field htmlFor="password" label="Пароль (от 12 символов)">
        <input
          autoComplete="new-password"
          className={controlClassName}
          id="password"
          minLength={12}
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
      {state.ok ? (
        <p className="text-sm text-ink-muted" role="status">
          Сотрудник создан.
        </p>
      ) : null}
      <button className={buttonClassName("primary")} disabled={pending} type="submit">
        {pending ? "Создаём…" : "Создать"}
      </button>
    </form>
  );
}
