"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type SavedItem = { id: string; slug: string; name: string; sku: string };

type Lists = {
  favorites: SavedItem[];
  compare: SavedItem[];
  toggleFavorite: (item: SavedItem) => void;
  toggleCompare: (item: SavedItem) => void;
};

export const useLists = create<Lists>()(
  persist(
    (set, get) => ({
      favorites: [],
      compare: [],
      toggleFavorite: (item) => {
        const exists = get().favorites.some((row) => row.id === item.id);
        set({
          favorites: exists ? get().favorites.filter((row) => row.id !== item.id) : [...get().favorites, item].slice(-30),
        });
      },
      toggleCompare: (item) => {
        const exists = get().compare.some((row) => row.id === item.id);
        const compare = exists ? get().compare.filter((row) => row.id !== item.id) : [...get().compare, item];
        set({ compare: compare.slice(-4) });
      },
    }),
    { name: "usaparts-lists" },
  ),
);
