import type { AppModule } from "@/modules/types";

export const searchModule = {
  id: "search",
  stage: 3,
  summary: "Поиск по артикулу, OEM и названию. VIN-декодер не подключён.",
} satisfies AppModule;

export { normalizeArticle } from "@/modules/search/normalize-article";
