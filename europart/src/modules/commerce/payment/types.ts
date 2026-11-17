export type PaymentProviderStatus =
  | {
      configured: false;
      provider: null;
      message: string;
    }
  | {
      configured: true;
      provider: string;
      message: string;
    };

export type CreatePaymentIntentInput = {
  orderId: string;
  orderNumber: string;
  amountCents: number;
  currency: string;
  idempotencyKey: string;
  returnUrl: string;
};

export type PaymentIntentResult =
  | {
      state: "unavailable";
      message: string;
    }
  | {
      state: "pending";
      provider: string;
      externalId?: string;
      redirectUrl?: string;
      message: string;
    };

export type PaymentWebhookResult =
  | { handled: false; reason: string }
  | {
      handled: true;
      duplicate: boolean;
      transactionStatus: "PENDING" | "SUCCEEDED" | "FAILED" | "CANCELLED" | "REFUNDED";
      externalId?: string;
      orderNumber?: string;
    };

export interface PaymentProvider {
  readonly key: string;
  status(): PaymentProviderStatus;
  createIntent(input: CreatePaymentIntentInput): Promise<PaymentIntentResult>;
  /** Verify signature and map provider payload — never trust client "paid". */
  verifyAndParseWebhook(input: {
    rawBody: string;
    headers: Headers;
  }): Promise<PaymentWebhookResult>;
}
