import { orderStatusLabels, type OrderStatusId } from "@/modules/commerce/order-status";
import { getSiteUrl } from "@/lib/env";

export type OrderNotifyPayload = {
  number: string;
  accessToken: string;
  customerName: string;
  customerPhone: string | null;
  customerEmail: string | null;
  totalCents?: number;
  checkoutMode?: "MANAGER" | "ONLINE";
  fromStatus?: OrderStatusId;
  toStatus?: OrderStatusId;
};

function orderUrl(accessToken: string): string {
  return `${getSiteUrl()}/order/${accessToken}`;
}

function money(cents: number | undefined): string {
  if (cents == null) {
    return "—";
  }
  return `${(cents / 100).toFixed(2)} BYN`;
}

export function managerOrderCreatedTemplate(payload: OrderNotifyPayload) {
  const subject = `EUROPART: новый заказ ${payload.number}`;
  const text = [
    `Новый заказ ${payload.number}`,
    `Клиент: ${payload.customerName}`,
    `Телефон: ${payload.customerPhone ?? "—"}`,
    `Email: ${payload.customerEmail ?? "—"}`,
    `Сумма: ${money(payload.totalCents)}`,
    `Режим: ${payload.checkoutMode === "ONLINE" ? "онлайн-оплата" : "менеджер"}`,
    `Карточка: ${orderUrl(payload.accessToken)}`,
  ].join("\n");
  return { subject, text };
}

export function customerOrderCreatedTemplate(payload: OrderNotifyPayload) {
  const subject = `EUROPART: заказ ${payload.number} принят`;
  const text = [
    `Здравствуйте, ${payload.customerName}!`,
    `Мы приняли заказ ${payload.number}.`,
    payload.checkoutMode === "ONLINE"
      ? "Онлайн-оплата доступна только если платёжный провайдер подключён; иначе менеджер свяжется с вами."
      : "Менеджер свяжется с вами для подтверждения и оплаты.",
    `Сумма: ${money(payload.totalCents)}`,
    `Статус заказа: ${orderUrl(payload.accessToken)}`,
  ].join("\n");
  return { subject, text };
}

export function managerOrderStatusTemplate(payload: OrderNotifyPayload) {
  const from = payload.fromStatus ? orderStatusLabels[payload.fromStatus] : "—";
  const to = payload.toStatus ? orderStatusLabels[payload.toStatus] : "—";
  const subject = `EUROPART: заказ ${payload.number} → ${to}`;
  const text = [
    `Заказ ${payload.number}: ${from} → ${to}`,
    `Клиент: ${payload.customerName}`,
    orderUrl(payload.accessToken),
  ].join("\n");
  return { subject, text };
}

export function customerOrderStatusTemplate(payload: OrderNotifyPayload) {
  const to = payload.toStatus ? orderStatusLabels[payload.toStatus] : "обновлён";
  const subject = `EUROPART: статус заказа ${payload.number}`;
  const text = [
    `Здравствуйте, ${payload.customerName}!`,
    `Статус заказа ${payload.number}: ${to}.`,
    orderUrl(payload.accessToken),
  ].join("\n");
  return { subject, text };
}

export function managerLeadTemplate(input: {
  type: string;
  name: string;
  phone: string | null;
  email: string | null;
  message: string | null;
  article: string | null;
}) {
  return {
    subject: `EUROPART: заявка ${input.type}`,
    text: [
      `Тип: ${input.type}`,
      `Имя: ${input.name}`,
      `Телефон: ${input.phone ?? "—"}`,
      `Email: ${input.email ?? "—"}`,
      `Артикул: ${input.article ?? "—"}`,
      `Сообщение: ${input.message ?? "—"}`,
    ].join("\n"),
  };
}
