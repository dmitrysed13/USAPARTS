import type { Metadata } from "next";
import { SavedLists } from "@/components/saved-lists";

export const metadata: Metadata = { title: "Сравнение", robots: { index: false, follow: false } };

export default function ComparePage() {
  return (
    <div className="page py-8">
      <h1 className="text-3xl font-semibold text-navy">Сравнение</h1>
      <p className="mt-2 text-sm">До четырёх товаров. Характеристики читаются из карточек.</p>
      <SavedLists mode="compare" />
    </div>
  );
}
