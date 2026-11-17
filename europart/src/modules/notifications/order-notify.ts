import "server-only";

import {
  customerOrderCreatedTemplate,
  customerOrderStatusTemplate,
  managerOrderCreatedTemplate,
  managerOrderStatusTemplate,
  type OrderNotifyPayload,
} from "@/modules/notifications/templates";
import { sendNotification } from "@/modules/notifications/channels";

/**
 * Fire-and-forget style: order creation must not fail if channels are down.
 * Results are logged to console for ops; never reported as customer-facing success.
 */
export async function notifyOrderCreated(payload: OrderNotifyPayload): Promise<void> {
  const manager = managerOrderCreatedTemplate(payload);
  const customer = customerOrderCreatedTemplate(payload);
  const results = await Promise.all([
    sendNotification({
      channel: "telegram",
      subject: manager.subject,
      text: manager.text,
    }),
    sendNotification({
      channel: "email",
      to: process.env.MANAGER_EMAIL,
      subject: manager.subject,
      text: manager.text,
    }),
    sendNotification({
      channel: "email",
      to: payload.customerEmail,
      subject: customer.subject,
      text: customer.text,
    }),
  ]);
  for (const result of results) {
    if (!result.ok) {
      console.info(`[notifications] skip ${result.channel}: ${result.reason}`);
    }
  }
}

export async function notifyOrderStatusChanged(
  payload: OrderNotifyPayload,
): Promise<void> {
  const manager = managerOrderStatusTemplate(payload);
  const customer = customerOrderStatusTemplate(payload);
  const results = await Promise.all([
    sendNotification({
      channel: "telegram",
      subject: manager.subject,
      text: manager.text,
    }),
    sendNotification({
      channel: "email",
      to: process.env.MANAGER_EMAIL,
      subject: manager.subject,
      text: manager.text,
    }),
    sendNotification({
      channel: "email",
      to: payload.customerEmail,
      subject: customer.subject,
      text: customer.text,
    }),
  ]);
  for (const result of results) {
    if (!result.ok) {
      console.info(`[notifications] skip ${result.channel}: ${result.reason}`);
    }
  }
}
