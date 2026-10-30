export type DeliveryQuote = {
  state: "manual" | "not_connected" | "quoted";
  priceCents: number | null;
  message: string;
};

export function deliveryProviderStatus() {
  if (!process.env.DELIVERY_PROVIDER) {
    return {
      state: "not_connected" as const,
      message: "API службы доставки не подключён. Стоимость международной доставки в заказ автоматически не включается.",
    };
  }
  return {
    state: "configured" as const,
    provider: process.env.DELIVERY_PROVIDER,
    message: `Перевозчик ${process.env.DELIVERY_PROVIDER} указан. Автоматический тариф всё равно требует отдельного адаптера расчёта.`,
  };
}

export function quoteDelivery(method: { adapter: string; priceCents: number | null; name: string }): DeliveryQuote {
  if (method.adapter === "carrier") {
    const provider = deliveryProviderStatus();
    return {
      state: "not_connected",
      priceCents: null,
      message: provider.message,
    };
  }
  if (method.priceCents == null) {
    return {
      state: "manual",
      priceCents: null,
      message: `«${method.name}»: сумма доставки не задана и не добавлена к заказу.`,
    };
  }
  return {
    state: "quoted",
    priceCents: method.priceCents,
    message: `Тариф «${method.name}» взят из справочника доставки.`,
  };
}
