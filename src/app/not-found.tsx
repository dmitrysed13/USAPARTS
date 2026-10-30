import Link from "next/link";

export default function NotFound() {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <p className="text-sm text-slate-500">404</p>
      <h1 className="mt-2 text-3xl font-semibold text-navy">Страница не найдена</h1>
      <p className="mt-3 leading-7">Такого адреса нет. Проверьте ссылку или перейдите в каталог и подбор по VIN.</p>
      <div className="mt-6 flex gap-3">
        <Link className="btn-navy" href="/catalog">Каталог</Link>
        <Link className="btn-ghost" href="/vin-search">Подбор по VIN</Link>
      </div>
    </main>
  );
}
