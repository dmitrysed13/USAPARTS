"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useLists } from "@/components/lists";
import { formatMoney } from "@/lib/money";

type Row = {
  id: string;
  name: string;
  slug: string;
  sku: string;
  priceCents: number | null;
  currency: string;
  stockStatus: string;
  specs: { name: string; value: string }[];
};

export function SavedLists({ mode }: { mode: "favorites" | "compare" }) {
  const items = useLists((state) => (mode === "favorites" ? state.favorites : state.compare));
  const [rows, setRows] = useState<Row[]>([]);
  useEffect(() => {
    if (!items.length) {
      setRows([]);
      return;
    }
    fetch(`/api/products?ids=${items.map((item) => item.id).join(",")}`)
      .then((response) => response.json())
      .then((data: { items?: Row[] }) => setRows(data.items ?? []))
      .catch(() => setRows([]));
  }, [items]);
  if (!items.length) return <p className="mt-4">Список пуст. Отметьте товары в карточке.</p>;
  return (
    <div className="mt-6 overflow-x-auto">
      <table className="w-full min-w-[640px] border-collapse text-sm">
        <thead>
          <tr className="border-b border-line text-left">
            <th className="py-2">Товар</th>
            <th>Артикул</th>
            <th>Цена из базы</th>
            <th>Наличие</th>
            {mode === "compare" && <th>Характеристики</th>}
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.id} className="border-b border-line">
              <td className="py-3"><Link className="text-navy underline" href={`/product/${row.slug}`}>{row.name}</Link></td>
              <td>{row.sku}</td>
              <td>{formatMoney(row.priceCents, row.currency)}</td>
              <td>{row.stockStatus}</td>
              {mode === "compare" && <td>{row.specs.map((spec) => `${spec.name}: ${spec.value}`).join("; ") || "нет"}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
