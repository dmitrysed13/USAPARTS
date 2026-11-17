-- EUROPART 3.0 §6 — cart/checkout support, order statuses, delivery methods, payments.
-- Additive. No seed orders, payments, or fake success rows.

CREATE TYPE "CheckoutMode" AS ENUM ('MANAGER', 'ONLINE');
CREATE TYPE "PaymentTransactionStatus" AS ENUM ('CREATED', 'PENDING', 'SUCCEEDED', 'FAILED', 'CANCELLED', 'REFUNDED');

ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'UNDER_REVIEW';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AWAITING_CONFIRMATION';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'AWAITING_PAYMENT';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'PAID';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'ORDERED_FROM_SUPPLIER';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'DELIVERED';
ALTER TYPE "OrderStatus" ADD VALUE IF NOT EXISTS 'RETURN';

CREATE TABLE "DeliveryMethod" (
    "id" UUID NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "requiresAddress" BOOLEAN NOT NULL DEFAULT false,
    "basePriceCents" INTEGER,
    "etaDaysMin" INTEGER,
    "etaDaysMax" INTEGER,
    "managerConfirmsCost" BOOLEAN NOT NULL DEFAULT true,
    "managerConfirmsEta" BOOLEAN NOT NULL DEFAULT true,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "DeliveryMethod_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "OrderStatusHistory" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "fromStatus" "OrderStatus",
    "toStatus" "OrderStatus" NOT NULL,
    "actor" TEXT NOT NULL,
    "note" TEXT,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "OrderStatusHistory_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentTransaction" (
    "id" UUID NOT NULL,
    "orderId" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "externalId" TEXT,
    "status" "PaymentTransactionStatus" NOT NULL DEFAULT 'CREATED',
    "amountCents" INTEGER NOT NULL,
    "currency" CHAR(3) NOT NULL DEFAULT 'BYN',
    "idempotencyKey" TEXT NOT NULL,
    "failureReason" TEXT,
    "metadata" JSONB,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMPTZ(3) NOT NULL,
    CONSTRAINT "PaymentTransaction_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "PaymentWebhook" (
    "id" UUID NOT NULL,
    "provider" TEXT NOT NULL,
    "eventId" TEXT NOT NULL,
    "signatureValid" BOOLEAN NOT NULL,
    "payload" JSONB NOT NULL,
    "processed" BOOLEAN NOT NULL DEFAULT false,
    "processError" TEXT,
    "transactionId" UUID,
    "createdAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "processedAt" TIMESTAMPTZ(3),
    CONSTRAINT "PaymentWebhook_pkey" PRIMARY KEY ("id")
);

ALTER TABLE "Order"
    ADD COLUMN "checkoutMode" "CheckoutMode" NOT NULL DEFAULT 'MANAGER',
    ADD COLUMN "customerCity" TEXT,
    ADD COLUMN "deliveryMethodId" UUID,
    ADD COLUMN "deliveryEtaText" TEXT,
    ADD COLUMN "deliveryCostConfirmedByManager" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "deliveryEtaConfirmedByManager" BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN "paymentNote" TEXT;

ALTER TABLE "OrderItem"
    ADD COLUMN "offerId" UUID,
    ADD COLUMN "offerUpdatedAt" TIMESTAMPTZ(3),
    ADD COLUMN "priceCapturedAt" TIMESTAMPTZ(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

CREATE UNIQUE INDEX "DeliveryMethod_code_key" ON "DeliveryMethod"("code");
CREATE INDEX "DeliveryMethod_isActive_sortOrder_idx" ON "DeliveryMethod"("isActive", "sortOrder");
CREATE INDEX "Order_deliveryMethodId_idx" ON "Order"("deliveryMethodId");
CREATE INDEX "OrderItem_offerId_idx" ON "OrderItem"("offerId");
CREATE INDEX "OrderStatusHistory_orderId_createdAt_idx" ON "OrderStatusHistory"("orderId", "createdAt");
CREATE UNIQUE INDEX "PaymentTransaction_idempotencyKey_key" ON "PaymentTransaction"("idempotencyKey");
CREATE INDEX "PaymentTransaction_orderId_createdAt_idx" ON "PaymentTransaction"("orderId", "createdAt");
CREATE INDEX "PaymentTransaction_provider_externalId_idx" ON "PaymentTransaction"("provider", "externalId");
CREATE INDEX "PaymentTransaction_status_idx" ON "PaymentTransaction"("status");
CREATE UNIQUE INDEX "PaymentWebhook_provider_eventId_key" ON "PaymentWebhook"("provider", "eventId");
CREATE INDEX "PaymentWebhook_createdAt_idx" ON "PaymentWebhook"("createdAt");

ALTER TABLE "Order" ADD CONSTRAINT "Order_deliveryMethodId_fkey" FOREIGN KEY ("deliveryMethodId") REFERENCES "DeliveryMethod"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_offerId_fkey" FOREIGN KEY ("offerId") REFERENCES "ProductOffer"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "OrderStatusHistory" ADD CONSTRAINT "OrderStatusHistory_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_orderId_fkey" FOREIGN KEY ("orderId") REFERENCES "Order"("id") ON DELETE CASCADE ON UPDATE CASCADE;
ALTER TABLE "PaymentWebhook" ADD CONSTRAINT "PaymentWebhook_transactionId_fkey" FOREIGN KEY ("transactionId") REFERENCES "PaymentTransaction"("id") ON DELETE SET NULL ON UPDATE CASCADE;

ALTER TABLE "Order" ADD CONSTRAINT "Order_money_nonneg" CHECK ("subtotalCents" >= 0 AND "discountCents" >= 0 AND "deliveryCents" >= 0 AND "totalCents" >= 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_qty_positive" CHECK ("quantity" > 0);
ALTER TABLE "OrderItem" ADD CONSTRAINT "OrderItem_price_nonneg" CHECK ("unitPriceCents" >= 0);
ALTER TABLE "PaymentTransaction" ADD CONSTRAINT "PaymentTransaction_amount_nonneg" CHECK ("amountCents" >= 0);
