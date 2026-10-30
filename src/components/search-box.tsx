"use client";

import { useEffect, useState } from "react";

type Suggestion = { id: string; name: string; slug: string; sku: string; oem: string | null; fuzzy: boolean };

export function SearchBox({ initial = "", large = false }: { initial?: string; large?: boolean }) {
  const [query, setQuery] = useState(initial);
  const [items, setItems] = useState<Suggestion[]>([]);

  useEffect(() => {
    if (query.trim().length < 2) {
      setItems([]);
      return;
    }
    const handle = setTimeout(() => {
      fetch(`/api/suggest?q=${encodeURIComponent(query)}`)
        .then((response) => response.json())
        .then((data: { items?: Suggestion[] }) => setItems(data.items ?? []))
        .catch(() => setItems([]));
    }, 200);
    return () => clearTimeout(handle);
  }, [query]);

  return (
    <form action="/search" method="get" role="search" className="relative">
      <label className="sr-only" htmlFor={large ? "q-hero" : "q-header"}>
        Поиск запчастей
      </label>
      <div className={`flex overflow-hidden rounded-md border border-white/10 bg-white ${large ? "shadow-card" : ""}`}>
        <input
          id={large ? "q-hero" : "q-header"}
          name="q"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="OEM, артикул или название"
          className={`w-full px-4 text-graphite outline-none ${large ? "py-4 text-base" : "py-2.5 text-sm"}`}
        />
        <button className="bg-cta px-5 font-semibold text-white hover:bg-cta-hover" type="submit">
          Найти
        </button>
      </div>
      {items.length > 0 && (
        <ul className="absolute z-20 mt-1 w-full overflow-hidden rounded-md border border-line bg-white text-sm shadow-card">
          {items.some((item) => item.fuzzy) && (
            <li className="bg-mist px-3 py-1 text-xs text-slate-500">Похожие совпадения, включая исправление опечаток</li>
          )}
          {items.map((item) => (
            <li key={item.id}>
              <a className="block px-3 py-2 hover:bg-mist" href={`/product/${item.slug}`}>
                {item.name}
                <span className="mt-0.5 block text-xs text-slate-500">
                  {item.sku}
                  {item.oem ? ` · ${item.oem}` : ""}
                </span>
              </a>
            </li>
          ))}
        </ul>
      )}
    </form>
  );
}
