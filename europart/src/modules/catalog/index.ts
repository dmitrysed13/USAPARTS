import type { AppModule } from "@/modules/types";

export const catalogModule = {
  id: "catalog",
  stage: 2,
  summary:
    "Категории, SSR-фильтры/сортировка/пагинация, пустые combo → 404. Корзина — §6.",
} satisfies AppModule;
