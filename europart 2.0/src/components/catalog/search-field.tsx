"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { buttonClassName } from "@/components/ui/button";
import { controlClassName } from "@/components/ui/field";

type Suggestion = {
  slug: string;
  name: string;
  article: string | null;
  partBrandName: string | null;
};

type SearchResponse = {
  items?: Array<{
    slug: string;
    name: string;
    article: string | null;
    partBrand: { name: string } | null;
  }>;
  message?: string;
};

export function SearchField({ initialQuery = "" }: { initialQuery?: string }) {
  const inputId = useId();
  const listId = useId();
  const [query, setQuery] = useState(initialQuery);
  const [items, setItems] = useState<Suggestion[]>([]);
  const [status, setStatus] = useState<"idle" | "loading" | "ready" | "empty" | "error">(
    "idle",
  );
  const [message, setMessage] = useState("");

  useEffect(() => {
    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    const controller = new AbortController();
    const timer = setTimeout(() => {
      setStatus("loading");
      fetch(`/api/catalog/search?q=${encodeURIComponent(trimmed)}&pageSize=5`, {
        signal: controller.signal,
      })
        .then(async (response) => {
          const body = (await response.json()) as SearchResponse;
          if (response.status === 429) {
            setItems([]);
            setStatus("error");
            setMessage(body.message ?? "Слишком много запросов. Подождите немного.");
            return;
          }
          if (!response.ok) {
            setItems([]);
            setStatus("error");
            setMessage(body.message ?? "Поиск временно недоступен.");
            return;
          }
          const next = (body.items ?? []).map((item) => ({
            slug: item.slug,
            name: item.name,
            article: item.article,
            partBrandName: item.partBrand?.name ?? null,
          }));
          setItems(next);
          setStatus(next.length === 0 ? "empty" : "ready");
          setMessage(next.length === 0 ? "Ничего не найдено" : "");
        })
        .catch((error: unknown) => {
          if (error instanceof DOMException && error.name === "AbortError") {
            return;
          }
          setItems([]);
          setStatus("error");
          setMessage("Поиск временно недоступен.");
        });
    }, 300);

    return () => {
      clearTimeout(timer);
      controller.abort();
    };
  }, [query]);

  const trimmed = query.trim();
  const open = trimmed.length >= 2 && status !== "idle";

  return (
    <form action="/search" className="relative" method="get" role="search">
      <label className="sr-only" htmlFor={inputId}>
        Поиск по названию, артикулу или OEM
      </label>
      <div className="flex flex-col gap-3 sm:flex-row">
        <input
          aria-controls={listId}
          aria-expanded={open}
          autoComplete="off"
          className={controlClassName}
          id={inputId}
          name="q"
          onChange={(event) => {
            const next = event.target.value;
            setQuery(next);
            if (next.trim().length < 2) {
              setItems([]);
              setStatus("idle");
              setMessage("");
            }
          }}
          placeholder="Название, артикул или OEM"
          role="combobox"
          value={query}
        />
        <button className={buttonClassName("primary")} type="submit">
          Найти
        </button>
      </div>
      {open ? (
        <div
          className="absolute z-30 mt-2 w-full rounded-2xl border border-line bg-surface p-2 shadow-[var(--shadow-card)]"
          id={listId}
        >
          {status === "loading" ? <p className="px-3 py-2 text-sm">Ищем…</p> : null}
          {status === "empty" ? (
            <p className="px-3 py-2 text-sm">Ничего не найдено</p>
          ) : null}
          {status === "error" ? (
            <p className="px-3 py-2 text-sm text-danger" role="alert">
              {message}
            </p>
          ) : null}
          {status === "ready" ? (
            <ul>
              {items.map((item) => (
                <li key={item.slug}>
                  <Link
                    className="block rounded-control px-3 py-2 hover:bg-surface-muted"
                    href={`/product/${item.slug}`}
                  >
                    <span className="block break-words font-medium">{item.name}</span>
                    <span className="mt-1 block break-all text-sm text-ink-muted">
                      {[item.article, item.partBrandName].filter(Boolean).join(" · ")}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      ) : null}
    </form>
  );
}
