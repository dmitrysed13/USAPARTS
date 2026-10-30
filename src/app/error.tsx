"use client";

export default function ErrorPage({ reset }: { error: Error; reset: () => void }) {
  return (
    <main className="mx-auto max-w-xl px-4 py-20">
      <h1 className="text-3xl font-semibold text-navy">Страница не открылась</h1>
      <p className="mt-3 leading-7">Ошибка записана в журнал сервера. Повторите запрос или вернитесь в каталог.</p>
      <button className="btn-navy mt-6" type="button" onClick={reset}>
        Повторить
      </button>
    </main>
  );
}
