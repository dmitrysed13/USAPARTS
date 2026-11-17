import { connection } from "next/server";
import { getOrderByAccessToken } from "@/modules/commerce/orders";
import { orderStatusLabels, type OrderStatusId } from "@/modules/commerce/order-status";
import { getPublicPaymentAvailability } from "@/modules/commerce/payment/service";

type Params = { params: Promise<{ token: string }> };

export async function GET(_request: Request, { params }: Params) {
  await connection();
  const { token } = await params;
  const order = await getOrderByAccessToken(token);
  if (!order) {
    return Response.json(
      { message: "Заказ не найден." },
      { status: 404, headers: { "cache-control": "no-store" } },
    );
  }
  const payment = await getPublicPaymentAvailability();
  return Response.json(
    {
      order: {
        number: order.number,
        status: order.status,
        statusLabel: orderStatusLabels[order.status as OrderStatusId],
        paymentState: order.paymentState,
        paymentNote: order.paymentNote,
        checkoutMode: order.checkoutMode,
        customerName: order.customerName,
        customerCity: order.customerCity,
        deliveryMethod: order.deliveryMethodRef?.name ?? order.deliveryMethod,
        deliveryAddress: order.deliveryAddress,
        deliveryNote: order.deliveryNote,
        deliveryEtaText: order.deliveryEtaText,
        deliveryCostConfirmedByManager: order.deliveryCostConfirmedByManager,
        deliveryEtaConfirmedByManager: order.deliveryEtaConfirmedByManager,
        subtotalCents: order.subtotalCents,
        deliveryCents: order.deliveryCents,
        totalCents: order.totalCents,
        currency: order.currency,
        createdAt: order.createdAt,
        items: order.items.map((item) => ({
          name: item.name,
          sku: item.sku,
          quantity: item.quantity,
          unitPriceCents: item.unitPriceCents,
          currency: item.currency,
        })),
        history: order.statusHistory.map((row) => ({
          fromStatus: row.fromStatus,
          toStatus: row.toStatus,
          createdAt: row.createdAt,
          note: row.note,
        })),
      },
      payment,
    },
    { headers: { "cache-control": "no-store" } },
  );
}
