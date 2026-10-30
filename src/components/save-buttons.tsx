"use client";

import { useLists, type SavedItem } from "@/components/lists";

export function SaveButtons({ item }: { item: SavedItem }) {
  const favorites = useLists((state) => state.favorites);
  const compare = useLists((state) => state.compare);
  const toggleFavorite = useLists((state) => state.toggleFavorite);
  const toggleCompare = useLists((state) => state.toggleCompare);
  const inFavorites = favorites.some((row) => row.id === item.id);
  const inCompare = compare.some((row) => row.id === item.id);
  return (
    <div className="flex flex-wrap gap-2">
      <button type="button" className="btn-ghost" onClick={() => toggleFavorite(item)}>
        {inFavorites ? "В избранном" : "В избранное"}
      </button>
      <button type="button" className="btn-ghost" onClick={() => toggleCompare(item)}>
        {inCompare ? "В сравнении" : "Сравнить"}
      </button>
    </div>
  );
}
