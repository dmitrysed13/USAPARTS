export const CONDITION_LABEL: Record<string, string> = {
  NEW: "Новая",
  USED: "Б/У",
  REFURBISHED: "Восстановленная",
};

export const STOCK_LABEL: Record<string, string> = {
  IN_STOCK: "В наличии",
  US_WAREHOUSE: "На складе в США",
  IN_TRANSIT: "В пути",
  ON_ORDER: "Под заказ",
  OUT_OF_STOCK: "Нет в наличии",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  NEW: "Новый",
  CONFIRMED: "Подтверждён",
  PAID: "Оплачен",
  ORDERED_US: "Заказан в США",
  SHIPPED: "Отправлен",
  IN_TRANSIT: "В пути",
  ARRIVED_WAREHOUSE: "Прибыл на склад",
  DELIVERED: "Доставлен",
  CANCELLED: "Отменён",
};

export const PAYMENT_LABEL: Record<string, string> = {
  NOT_CONNECTED: "Оплата не подключена",
  AWAITING_MANAGER: "Ожидает подтверждения менеджера",
  PENDING: "Платёж создан",
  PAID: "Оплачен",
  FAILED: "Ошибка оплаты",
  REFUNDED: "Возврат",
};

export const VIN_STATUS_LABEL: Record<string, string> = {
  NEW: "Новая",
  IN_PROGRESS: "В работе",
  DONE: "Закрыта",
  CANCELLED: "Отменена",
};

export const INQUIRY_LABEL: Record<string, string> = {
  QUESTION: "Вопрос",
  AVAILABILITY: "Уточнение наличия",
  ORDER_FROM_US: "Заказ из США",
};

export const ROLE_LABEL: Record<string, string> = {
  ADMIN: "Администратор",
  MANAGER: "Менеджер",
  CONTENT: "Контент-менеджер",
  CUSTOMER: "Покупатель",
};

export const ORDER_STATUSES = Object.keys(ORDER_STATUS_LABEL);
export const STOCK_STATUSES = Object.keys(STOCK_LABEL);
export const CONDITIONS = Object.keys(CONDITION_LABEL);

export function plural(n: number, one: string, few: string, many: string) {
  const n10 = n % 10;
  const n100 = n % 100;
  if (n10 === 1 && n100 !== 11) return one;
  if (n10 >= 2 && n10 <= 4 && (n100 < 12 || n100 > 14)) return few;
  return many;
}

export function schemaAvailability(status: string) {
  if (status === "IN_STOCK" || status === "US_WAREHOUSE") return "https://schema.org/InStock";
  if (status === "IN_TRANSIT" || status === "ON_ORDER") return "https://schema.org/PreOrder";
  return "https://schema.org/OutOfStock";
}

export function schemaCondition(condition: string) {
  if (condition === "NEW") return "https://schema.org/NewCondition";
  if (condition === "REFURBISHED") return "https://schema.org/RefurbishedCondition";
  return "https://schema.org/UsedCondition";
}
