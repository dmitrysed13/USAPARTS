import "server-only";

import { z } from "zod";
import { getPrismaClient } from "@/lib/db/prisma";
import { managerLeadTemplate } from "@/modules/notifications/templates";
import { sendNotification } from "@/modules/notifications/channels";

const leadSchema = z
  .object({
    type: z.enum(["RARE_PART", "PRICE_REQUEST", "B2B", "CONTACT"]),
    name: z.string().trim().min(2).max(120),
    phone: z.string().trim().max(40).optional(),
    email: z.union([z.literal(""), z.email()]).optional(),
    message: z.string().trim().max(4000).optional(),
    productId: z.string().uuid().optional(),
    vin: z.string().trim().max(32).optional(),
    article: z.string().trim().max(80).optional(),
    ip: z.string().trim().max(64).optional(),
  })
  .refine((value) => Boolean(value.phone?.trim() || value.email?.trim()), {
    message: "Укажите телефон или email.",
  });

export type LeadInput = z.input<typeof leadSchema>;

export async function createLead(input: LeadInput) {
  const parsed = leadSchema.parse(input);
  const lead = await getPrismaClient().lead.create({
    data: {
      type: parsed.type,
      name: parsed.name,
      phone: parsed.phone || null,
      email: parsed.email || null,
      message: parsed.message || null,
      productId: parsed.productId || null,
      vin: parsed.vin || null,
      article: parsed.article || null,
      ip: parsed.ip || null,
    },
  });

  const template = managerLeadTemplate({
    type: lead.type,
    name: lead.name,
    phone: lead.phone,
    email: lead.email,
    message: lead.message,
    article: lead.article,
  });
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
      console.info(`[notifications] skip ${result.channel}: ${result.reason}`);
    }
  }

  return lead;
}
