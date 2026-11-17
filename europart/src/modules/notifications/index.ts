import type { AppModule } from "@/modules/types";

export const notificationsModule = {
  id: "notifications",
  stage: 6,
  summary:
    "Письма и Telegram по заказам/заявкам. Без SMTP/бота отправка не считается успешной.",
} satisfies AppModule;

export { sendNotification } from "@/modules/notifications/channels";
export {
  managerOrderCreatedTemplate,
  customerOrderCreatedTemplate,
  managerLeadTemplate,
  managerVinRequestTemplate,
} from "@/modules/notifications/templates";
