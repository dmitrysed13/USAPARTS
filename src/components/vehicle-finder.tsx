"use client";

import { useMemo, useState } from "react";
import type { FinderMake } from "@/lib/dto";

export function VehicleFinder({ makes, categories }: { makes: FinderMake[]; categories: { name: string; slug: string }[] }) {
  const [make, setMake] = useState("");
  const [model, setModel] = useState("");
  const models = useMemo(() => makes.find((item) => item.slug === make)?.models ?? [], [make, makes]);

  return (
    <form action="/search" method="get" className="grid gap-3 md:grid-cols-5">
      <label className="text-sm text-white/80">
        Марка
        <select
          name="make"
          className="field mt-1"
          value={make}
          onChange={(event) => {
            setMake(event.target.value);
            setModel("");
          }}
        >
          <option value="">Все</option>
          {makes.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-white/80">
        Модель
        <select name="model" className="field mt-1" value={model} onChange={(event) => setModel(event.target.value)}>
          <option value="">Все</option>
          {models.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <label className="text-sm text-white/80">
        Год
        <input name="year" inputMode="numeric" placeholder="2018" className="field mt-1" />
      </label>
      <label className="text-sm text-white/80">
        Двигатель
        <input name="engine" placeholder="код, если известен" className="field mt-1" />
      </label>
      <label className="text-sm text-white/80">
        Категория
        <select name="category" className="field mt-1" defaultValue="">
          <option value="">Все</option>
          {categories.map((item) => (
            <option key={item.slug} value={item.slug}>
              {item.name}
            </option>
          ))}
        </select>
      </label>
      <button className="btn-cta md:col-span-5" type="submit">
        Показать запчасти
      </button>
    </form>
  );
}
