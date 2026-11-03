import type { AppModule } from "@/modules/types";

export const adminModule = {
  id: "admin",
  stage: 3,
  summary:
    "Поставщики, склады, черновики товаров и журнал. Заказы и роли пользователей ещё не подключены.",
} satisfies AppModule;
