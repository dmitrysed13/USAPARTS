import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { listOrders } from "@/modules/commerce/orders";
import { orderStatusLabels, type OrderStatusId } from "@/modules/commerce/order-status";

export default async function AdminOrdersPage() {
  await connection();
  await requireAdminSession("orders");
  const orders = await listOrders();
  return (
    <div>
      <AdminPageHeader description="Заказы §6." title="Orders" />
      <AdminTable
        columns={["Number", "Status", "Payment", "Customer", "Total", "Items"]}
        emptyDescription="Заказов пока нет."
        emptyTitle="Orders пусто"
        rows={orders.map((order) => [
          order.number,
          orderStatusLabels[order.status as OrderStatusId] ?? order.status,
          order.paymentState,
          order.customerName,
          `${(order.totalCents / 100).toFixed(2)} ${order.currency}`,
          String(order._count.items),
        ])}
      />
      <AdminApiHint path="/api/admin/orders" />
    </div>
  );
}
