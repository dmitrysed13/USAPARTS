import type { Metadata } from "next";
import { connection } from "next/server";
import { Container } from "@/components/ui/container";
import { Field, controlClassName } from "@/components/ui/field";
import { buttonClassName } from "@/components/ui/button";
import { configuredAdminPassword } from "@/lib/admin/session";

export const metadata: Metadata = {
  title: "Вход в админ-панель",
  robots: { index: false, follow: false },
};

export const instant = false;

export default async function AdminLoginPage({
  searchParams,
}: {
  searchParams: Promise<{ reason?: string; error?: string }>;
}) {
  await connection();
  const password = configuredAdminPassword();
  const params = await searchParams;
  const message =
    params.error ||
    (params.reason === "unconfigured" || !password
      ? "Админ-панель закрыта, пока в окружении не задан ADMIN_PASSWORD длиной от 12 символов. Пароль в репозиторий не записывается."
      : null);

  return (
    <Container className="py-16">
      <div className="mx-auto grid max-w-md gap-6">
        <h1 className="font-display text-3xl font-semibold">Вход для сотрудников</h1>
        <p className="text-sm leading-6 text-ink-muted">
          Здесь управляют поставщиками, прайсами и остатками. Покупатели эту страницу в
          меню не видят.
        </p>
        {message ? (
          <p
            className="rounded-control border border-danger/20 bg-brand-soft px-4 py-3 text-sm"
            role="alert"
          >
            {message}
          </p>
        ) : null}
        {password ? (
          <form action="/api/admin/login" className="grid gap-4" method="post">
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
            <button className={buttonClassName()} type="submit">
              Войти
            </button>
          </form>
        ) : null}
      </div>
    </Container>
  );
}
