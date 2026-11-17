import { createHmac } from "node:crypto";
import { describe, expect, it } from "vitest";
import {
  createEnvPaymentProvider,
  paymentProviderStatus,
} from "@/modules/commerce/payment/provider";

describe("payment provider", () => {
  it("stays unavailable without credentials", () => {
    expect(paymentProviderStatus({}).configured).toBe(false);
  });

  it("never invents a successful intent", async () => {
    const provider = createEnvPaymentProvider({
      PAYMENT_PROVIDER: "test-by",
      PAYMENT_WEBHOOK_SECRET: "webhook-secret-16+",
    });
    const intent = await provider.createIntent({
      orderId: "o1",
      orderNumber: "EP-1",
      amountCents: 100,
      currency: "BYN",
      idempotencyKey: "k1",
      returnUrl: "http://localhost/order/x",
    });
    expect(intent.state).toBe("pending");
    if (intent.state === "pending") {
      expect(intent.message).toMatch(/не оплачен/);
    }
  });

  it("rejects unsigned webhooks and accepts signed ones", async () => {
    const secret = "webhook-secret-16+";
    const provider = createEnvPaymentProvider({
      PAYMENT_PROVIDER: "test-by",
      PAYMENT_WEBHOOK_SECRET: secret,
    });
    const body = JSON.stringify({
      eventId: "evt-1",
      status: "paid",
      orderNumber: "EP-1",
    });
    await expect(
      provider.verifyAndParseWebhook({
        rawBody: body,
        headers: new Headers(),
      }),
    ).resolves.toMatchObject({ handled: false });

    const signature = createHmac("sha256", secret).update(body).digest("hex");
    await expect(
      provider.verifyAndParseWebhook({
        rawBody: body,
        headers: new Headers({ "x-europart-signature": signature }),
      }),
    ).resolves.toMatchObject({
      handled: true,
      transactionStatus: "SUCCEEDED",
    });
  });
});
