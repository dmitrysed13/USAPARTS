import { createHmac, timingSafeEqual } from "node:crypto";
import type {
  CreatePaymentIntentInput,
  PaymentIntentResult,
  PaymentProvider,
  PaymentProviderStatus,
  PaymentWebhookResult,
} from "@/modules/commerce/payment/types";

export function paymentProviderStatus(
  source: Record<string, string | undefined> = process.env,
): PaymentProviderStatus {
  const provider = source.PAYMENT_PROVIDER?.trim();
  if (!provider) {
    return {
      configured: false,
      provider: null,
      message:
        "Онлайн-оплата недоступна: платёжный провайдер не подключён. Заказ оформляется через менеджера.",
    };
  }
  const secret = source.PAYMENT_WEBHOOK_SECRET?.trim();
  if (!secret || secret.length < 16) {
    return {
      configured: false,
      provider: null,
      message:
        "Онлайн-оплата недоступна: задайте PAYMENT_PROVIDER и PAYMENT_WEBHOOK_SECRET (не храните в git).",
    };
  }
  return {
    configured: true,
    provider,
    message: `Провайдер «${provider}» указан в окружении. Списание выполняет адаптер провайдера.`,
  };
}

/**
 * Fail-closed stub. Never reports success. BY acquiring adapters plug in later.
 */
export const unconfiguredPaymentProvider: PaymentProvider = {
  key: "unconfigured",
  status() {
    return paymentProviderStatus();
  },
  async createIntent() {
    const status = paymentProviderStatus();
    return {
      state: "unavailable",
      message: status.message,
    };
  },
  async verifyAndParseWebhook() {
    return { handled: false, reason: "Платёжный провайдер не подключён." };
  },
};

/**
 * Placeholder adapter when PAYMENT_PROVIDER is set but no BY SDK is wired yet.
 * createIntent stays pending (not paid). Webhooks require HMAC signature.
 */
export function createEnvPaymentProvider(
  source: Record<string, string | undefined> = process.env,
): PaymentProvider {
  const status = paymentProviderStatus(source);
  if (!status.configured) {
    return unconfiguredPaymentProvider;
  }
  const providerName = status.provider;
  const webhookSecret = source.PAYMENT_WEBHOOK_SECRET!.trim();

  return {
    key: providerName,
    status() {
      return paymentProviderStatus(source);
    },
    async createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult> {
      return {
        state: "pending",
        provider: providerName,
        message: `Провайдер «${providerName}» указан, но адаптер списания ещё не реализован. Заказ ${input.orderNumber} не оплачен онлайн.`,
      };
    },
    async verifyAndParseWebhook(input): Promise<PaymentWebhookResult> {
      const signature = input.headers.get("x-europart-signature") ?? "";
      const expected = createHmac("sha256", webhookSecret)
        .update(input.rawBody)
        .digest("hex");
      const left = Buffer.from(signature);
      const right = Buffer.from(expected);
      if (left.length !== right.length || !timingSafeEqual(left, right)) {
        return { handled: false, reason: "Подпись вебхука неверна." };
      }
      let payload: {
        eventId?: string;
        status?: string;
        externalId?: string;
        orderNumber?: string;
      };
      try {
        payload = JSON.parse(input.rawBody) as typeof payload;
      } catch {
        return { handled: false, reason: "Тело вебхука не JSON." };
      }
      if (!payload.eventId || !payload.status) {
        return { handled: false, reason: "В вебхуке нет eventId или status." };
      }
      const statusMap: Record<
        string,
        "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "REFUNDED"
      > = {
        pending: "PENDING",
        succeeded: "SUCCEEDED",
        paid: "SUCCEEDED",
        failed: "FAILED",
        cancelled: "CANCELLED",
        refunded: "REFUNDED",
      };
      const transactionStatus = statusMap[payload.status.toLowerCase()];
      if (!transactionStatus) {
        return { handled: false, reason: `Неизвестный статус «${payload.status}».` };
      }
      return {
        handled: true,
        duplicate: false,
        transactionStatus,
        externalId: payload.externalId,
        orderNumber: payload.orderNumber,
      };
    },
  };
}

export function resolvePaymentProvider(
  source: Record<string, string | undefined> = process.env,
): PaymentProvider {
  return createEnvPaymentProvider(source);
}
