import "server-only";

import { sendNotification } from "@/modules/notifications/channels";
import { managerVinRequestTemplate } from "@/modules/notifications/templates";

export async function notifyManagersAboutVinRequest(input: {
  id: string;
  vin: string;
  vinIsStandard: boolean;
  customerName: string;
  phone: string | null;
  email: string | null;
  comment: string | null;
  partName: string | null;
  partNumber: string | null;
  vehicleBrand: string | null;
  vehicleModel: string | null;
  vehicleYear: number | null;
}) {
  const template = managerVinRequestTemplate(input);
  const results = await Promise.all([
    sendNotification({
      channel: "telegram",
      subject: template.subject,
      text: template.text,
    }),
    sendNotification({
      channel: "email",
      to: process.env.MANAGER_EMAIL,
      subject: template.subject,
      text: template.text,
    }),
  ]);
  for (const result of results) {
    if (!result.ok) {
      console.info(`[notifications] vin skip ${result.channel}: ${result.reason}`);
    }
  }
  return results;
}
