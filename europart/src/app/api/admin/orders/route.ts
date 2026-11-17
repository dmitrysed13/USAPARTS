import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson } from "@/modules/admin/respond";
import { listOrders } from "@/modules/commerce/orders";
import { orderStatusLabels, type OrderStatusId } from "@/modules/commerce/order-status";

export async function GET(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "orders");
  if (!gate.ok) {
    return gate.response;
  }
  const orders = await listOrders();
  return adminJson({
    orders: orders.map((order) => ({
      id: order.id,
      number: order.number,
      status: order.status,
      statusLabel: orderStatusLabels[order.status as OrderStatusId],
      paymentState: order.paymentState,
      checkoutMode: order.checkoutMode,
      customerName: order.customerName,
      totalCents: order.totalCents,
      currency: order.currency,
      itemCount: order._count.items,
      deliveryMethod: order.deliveryMethodRef?.name ?? order.deliveryMethod,
      createdAt: order.createdAt,
    })),
  });
}
