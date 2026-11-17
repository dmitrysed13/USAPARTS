import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import {
  confirmOrderDelivery,
} from "@/modules/commerce/delivery";
import {
  getOrderById,
  transitionOrderStatus,
} from "@/modules/commerce/orders";
import {
  orderStatuses,
  type OrderStatusId,
} from "@/modules/commerce/order-status";

type Params = { params: Promise<{ id: string }> };

export async function GET(request: Request, { params }: Params) {
  await connection();
  const gate = await requireAdminApiAsync(request, "orders");
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await params;
  const order = await getOrderById(id);
  if (!order) {
    return adminJson({ message: "Заказ не найден." }, 404);
  }
  return adminJson({ order });
}

export async function POST(request: Request, { params }: Params) {
  await connection();
  const gate = await requireAdminApiAsync(request, "orders");
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    if (body.action === "status") {
      const toStatus = String(body.toStatus ?? "") as OrderStatusId;
      if (!orderStatuses.includes(toStatus)) {
        throw new Error("Неизвестный статус заказа.");
      }
      const order = await transitionOrderStatus({
        orderId: id,
        toStatus,
        note: body.note ? String(body.note) : undefined,
      });
      return adminJson({ id: order.id, status: order.status });
    }
    if (body.action === "confirm-delivery") {
      const order = await confirmOrderDelivery({
        orderId: id,
        deliveryCents:
          body.deliveryCents === undefined ? undefined : Number(body.deliveryCents),
        deliveryEtaText:
          body.deliveryEtaText === undefined
            ? undefined
            : body.deliveryEtaText
              ? String(body.deliveryEtaText)
              : null,
        confirmCost: body.confirmCost !== false,
        confirmEta: body.confirmEta !== false,
      });
      return adminJson({
        id: order.id,
        deliveryCents: order.deliveryCents,
        totalCents: order.totalCents,
      });
    }
    throw new Error("Укажите action: status | confirm-delivery.");
  } catch (error) {
    return fail(
      request,
      `/api/admin/orders/${id}`,
      publicError(error, "Операция не выполнена."),
      400,
    );
  }
}
