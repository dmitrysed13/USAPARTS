export type PaymentIntent =
  | { state: "not_connected"; message: string }
  | { state: "pending"; message: string; redirectUrl?: string };

export function paymentStatus() {
  if (!process.env.PAYMENT_PROVIDER) {
    return {
      state: "not_connected" as const,
      provider: null,
      message: "Платёжный провайдер не подключён. Заказ сохраняется, оплату подтверждает менеджер.",
    };
  }
  return {
    state: "configured" as const,
    provider: process.env.PAYMENT_PROVIDER,
    message: `Провайдер ${process.env.PAYMENT_PROVIDER} указан в конфигурации.`,
  };
}

export async function createPaymentIntent(order: {
  number: string;
  totalCents: number;
  currency: string;
}): Promise<PaymentIntent> {
  const status = paymentStatus();
  if (status.state === "not_connected") return { state: "not_connected", message: status.message };
  return {
    state: "pending",
    message: `Провайдер ${status.provider} указан, но адаптер списания для него ещё не реализован. Заказ ${order.number} не оплачен онлайн.`,
  };
}
