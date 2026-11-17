"use client";

import Link from "next/link";
import { buttonClassName } from "@/components/ui/button";

export default function AdminError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto grid max-w-lg gap-4 px-4 py-16">
      <h1 className="font-display text-3xl font-semibold">Ошибка админки</h1>
      <p className="text-ink-muted">{error.message || "Не удалось открыть раздел."}</p>
      <div className="flex flex-wrap gap-3">
        <button className={buttonClassName("primary")} onClick={reset} type="button">
          Повторить
        </button>
        <Link className={buttonClassName("ghost")} href="/admin">
          Dashboard
        </Link>
      </div>
    </div>
  );
}
