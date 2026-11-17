import type { AppModule } from "@/modules/types";

export const notificationsModule = {
  id: "notifications",
  stage: 4,
  summary:
    "Письма и Telegram менеджеру. Отправка не считается успешной без настроенного канала.",
} satisfies AppModule;
