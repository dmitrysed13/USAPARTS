import { prisma } from "@/lib/db";
import { quoteDelivery } from "@/lib/integrations/delivery";
import { createPaymentIntent } from "@/lib/integrations/payments";
import { randomBytes } from "crypto";

export type CheckoutInput = {
  name: string;
  email: string;
  phone: string;
  comment?: string;
  address?: string;
  deliveryMethodId: string;
  couponCode?: string;
  userId?: string;
  items: { productId: string; quantity: number }[];
};

export async function placeOrder(input: CheckoutInput) {
  return prisma.$transaction(async (tx) => {
    const ids = input.items.map((item) => item.productId);
    const products = await tx.product.findMany({ where: { id: { in: ids }, isPublished: true } });
    const byId = new Map(products.map((product) => [product.id, product]));
    if (products.length !== new Set(ids).size) {
      throw new Error("stock");
    }
    let subtotal = 0;
    const lines: {
      productId: string;
      sku: string;
      name: string;
      unitPriceCents: number;
      quantity: number;
      currency: string;
    }[] = [];
    for (const item of input.items) {
      const product = byId.get(item.productId);
      if (!product || product.priceCents == null) throw new Error("price");
      const sellable =
        product.allowBackorder ||
        product.stockStatus === "ON_ORDER" ||
        product.stockStatus === "IN_TRANSIT" ||
        product.quantity >= item.quantity;
      if (product.stockStatus === "OUT_OF_STOCK" && !product.allowBackorder) throw new Error("stock");
      if (!sellable) throw new Error("stock");
      if ((product.stockStatus === "IN_STOCK" || product.stockStatus === "US_WAREHOUSE") && product.quantity < item.quantity && !product.allowBackorder) {
        throw new Error("stock");
      }
      subtotal += product.priceCents * item.quantity;
      lines.push({
        productId: product.id,
        sku: product.sku,
        name: product.name,
        unitPriceCents: product.priceCents,
        quantity: item.quantity,
        currency: product.currency,
      });
    }
    const method = await tx.deliveryMethod.findFirst({ where: { id: input.deliveryMethodId, isActive: true } });
    if (!method) throw new Error("delivery");
    const quote = quoteDelivery(method);
    const deliveryCents = quote.priceCents ?? 0;
    let discount = 0;
    let couponId: string | undefined;
    const code = input.couponCode?.trim().toUpperCase();
    if (code) {
      const coupon = await tx.coupon.findUnique({ where: { code } });
      if (!coupon || !coupon.isActive || (coupon.expiresAt && coupon.expiresAt < new Date())) throw new Error("coupon");
      discount = coupon.type === "PERCENT" ? Math.floor((subtotal * coupon.amount) / 100) : Math.min(subtotal, coupon.amount);
      couponId = coupon.id;
    }
    const total = Math.max(0, subtotal - discount + deliveryCents);
    const seq = await tx.$queryRaw<{ n: bigint }[]>`SELECT nextval('order_number_seq')::bigint AS n`;
    const number = `USA-${new Date().getFullYear()}-${String(seq[0]?.n ?? 0n).padStart(6, "0")}`;
    const payment = await createPaymentIntent({ number, totalCents: total, currency: "USD" });
    const customer = await tx.customer.create({
      data: { name: input.name, email: input.email.toLowerCase(), phone: input.phone, userId: input.userId },
    });
    const order = await tx.order.create({
      data: {
        number,
        accessToken: randomBytes(24).toString("base64url"),
        customerId: customer.id,
        userId: input.userId,
        comment: input.comment,
        deliveryMethodId: method.id,
        deliveryAddress: input.address,
        deliveryNote: quote.message,
        couponId,
        subtotalCents: subtotal,
        discountCents: discount,
        deliveryCents,
        totalCents: total,
        currency: "USD",
        paymentState: payment.state === "pending" ? "PENDING" : "AWAITING_MANAGER",
        paymentNote: payment.message,
        items: { create: lines },
      },
    });
    for (const line of lines) {
      const product = byId.get(line.productId)!;
      const tracksUnits = product.stockStatus === "IN_STOCK" || product.stockStatus === "US_WAREHOUSE";
      if (!tracksUnits || product.quantity < line.quantity) continue;
      const updated = await tx.product.updateMany({
        where: { id: product.id, quantity: { gte: line.quantity } },
        data: { quantity: { decrement: line.quantity } },
      });
      if (updated.count !== 1) throw new Error("stock");
      await tx.product.updateMany({
        where: { id: product.id, quantity: 0, stockStatus: { in: ["IN_STOCK", "US_WAREHOUSE"] } },
        data: { stockStatus: "OUT_OF_STOCK" },
      });
      const warehouse = product.stockStatus === "US_WAREHOUSE" ? "US" : "LOCAL";
      await tx.inventory.updateMany({
        where: { productId: product.id, warehouse, quantity: { gte: line.quantity } },
        data: { quantity: { decrement: line.quantity } },
      });
    }
    return { order, slugs: products.map((product) => product.slug) };
  });
}
