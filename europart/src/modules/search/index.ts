import type { AppModule } from "@/modules/types";

export const searchModule = {
  id: "search",
  stage: 3,
  summary:
    "OEM/MPN/кросс/аналоги, нормализация пробелов и дефисов; VIN — заявка + VinCatalog без фейковой расшифровки.",
} satisfies AppModule;

export { normalizeArticle } from "@/modules/search/normalize-article";
