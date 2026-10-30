import type { Metadata } from "next";
import { SavedLists } from "@/components/saved-lists";

export const metadata: Metadata = { title: "Избранное", robots: { index: false, follow: false } };

export default function FavoritesPage() {
  return (
    <div className="page py-8">
      <h1 className="text-3xl font-semibold text-navy">Избранное</h1>
      <p className="mt-2 text-sm">Список хранится в этом браузере. Цены подгружаются из базы.</p>
      <SavedLists mode="favorites" />
    </div>
  );
}
