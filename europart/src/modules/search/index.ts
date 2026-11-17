import type { AppModule } from "@/modules/types";

export const searchModule = {
  id: "search",
  stage: 2,
  summary:
    "Поиск по артикулу, OEM, кроссу и названию. VIN сохраняется заявкой, без расшифровки.",
} satisfies AppModule;

export { normalizeArticle } from "@/modules/search/normalize-article";
