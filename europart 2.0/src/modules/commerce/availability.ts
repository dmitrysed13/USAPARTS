export const availabilityStatuses = [
  "in_stock",
  "low_stock",
  "on_order",
  "incoming",
  "out_of_stock",
  "discontinued",
] as const;

export type AvailabilityStatus = (typeof availabilityStatuses)[number];

export const availabilityLabels: Record<AvailabilityStatus, string> = {
  in_stock: "В наличии",
  low_stock: "Мало на складе",
  on_order: "Под заказ",
  incoming: "Ожидается поставка",
  out_of_stock: "Нет в наличии",
  discontinued: "Снят с продажи",
};

function pluralDays(days: number): string {
  const absolute = Math.abs(days) % 100;
  const last = absolute % 10;
  if (absolute > 10 && absolute < 20) {
    return "дней";
  }
  if (last > 1 && last < 5) {
    return "дня";
  }
  if (last === 1) {
    return "день";
  }
  return "дней";
}

/** Unknown lead time stays unknown. Zero means the part can be handed over today. */
export function formatLeadTime(days: number | null): string {
  if (days === null) {
    return "Срок уточняется";
  }
  if (days === 0) {
    return "Сегодня";
  }
  return `${days} ${pluralDays(days)}`;
}
