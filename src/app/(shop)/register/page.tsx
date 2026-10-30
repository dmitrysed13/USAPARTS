import type { Metadata } from "next";
import { Notice } from "@/components/notice";
import { registerAction } from "@/server/actions/auth";

export const metadata: Metadata = { title: "Регистрация", robots: { index: false, follow: false } };

export default async function RegisterPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const query = await searchParams;
  return (
    <div className="page py-10">
      <form action={registerAction} className="card mx-auto max-w-md space-y-3 p-6">
        <h1 className="text-2xl font-semibold text-navy">Регистрация</h1>
        <p className="text-sm">Создаётся роль покупателя. Сотрудников добавляет администратор.</p>
        <Notice error={query.error} />
        <label className="block text-sm">Имя<input name="name" required className="field mt-1" /></label>
        <label className="block text-sm">Email<input name="email" type="email" required className="field mt-1" /></label>
        <label className="block text-sm">Телефон<input name="phone" className="field mt-1" /></label>
        <label className="block text-sm">Пароль<input name="password" type="password" required minLength={8} className="field mt-1" /></label>
        <button className="btn-navy" type="submit">Создать аккаунт</button>
      </form>
    </div>
  );
}
