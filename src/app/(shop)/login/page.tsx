import type { Metadata } from "next";
import Link from "next/link";
import { Notice } from "@/components/notice";
import { loginAction } from "@/server/actions/auth";
import { getSettings } from "@/lib/site";

export const metadata: Metadata = { title: "Вход", robots: { index: false, follow: false } };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; next?: string }> }) {
  const query = await searchParams;
  const settings = await getSettings();
  return (
    <div className="page py-10">
      <form action={loginAction} className="card mx-auto max-w-md space-y-3 p-6">
        <h1 className="text-2xl font-semibold text-navy">Вход</h1>
        <Notice error={query.error} />
        <input type="hidden" name="next" value={query.next ?? "/account"} />
        <label className="block text-sm">Email<input name="email" type="email" required className="field mt-1" /></label>
        <label className="block text-sm">Пароль<input name="password" type="password" required className="field mt-1" /></label>
        <button className="btn-navy" type="submit">Войти</button>
        <p className="text-sm"><Link href="/register" className="text-navy underline">Регистрация покупателя</Link></p>
        {settings.demoMode && (
          <div className="rounded-md bg-amber-50 p-3 text-xs leading-5 text-amber-950">
            Демо-доступ: admin@usaparts.test / ChangeMe_Admin1, manager@usaparts.test / ChangeMe_Manager1, content@usaparts.test / ChangeMe_Content1.
            Смените пароли перед реальной публикацией.
          </div>
        )}
      </form>
    </div>
  );
}
