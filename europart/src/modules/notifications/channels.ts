import "server-only";

import { IntegrationNotConfiguredError } from "@/modules/integrations/ports";

export type NotifyChannel = "email" | "telegram";

export type NotifyResult =
  | { ok: true; channel: NotifyChannel }
  | { ok: false; channel: NotifyChannel; reason: string };

function emailConfigured(source = process.env): boolean {
  return Boolean(source.SMTP_HOST?.trim() && source.SMTP_FROM?.trim());
}

function telegramConfigured(source = process.env): boolean {
  return Boolean(source.TELEGRAM_BOT_TOKEN?.trim() && source.TELEGRAM_CHAT_ID?.trim());
}

/**
 * Attempts delivery. Missing credentials → fail closed (ok:false), never fake success.
 */
export async function sendNotification(input: {
  channel: NotifyChannel;
  to?: string | null;
  subject: string;
  text: string;
}): Promise<NotifyResult> {
  if (input.channel === "email") {
    if (!emailConfigured()) {
      return {
        ok: false,
        channel: "email",
        reason: "SMTP не настроен (SMTP_HOST / SMTP_FROM).",
      };
    }
    if (!input.to) {
      return { ok: false, channel: "email", reason: "Нет адреса получателя." };
    }
    // Transport adapter lands with real SMTP creds — until then do not pretend sent.
    return {
      ok: false,
      channel: "email",
      reason:
        "SMTP указан в окружении, но транспорт ещё не подключён. Письмо не отправлено.",
    };
  }

  if (!telegramConfigured()) {
    return {
      ok: false,
      channel: "telegram",
      reason: "Telegram не настроен (TELEGRAM_BOT_TOKEN / TELEGRAM_CHAT_ID).",
    };
  }
  return {
    ok: false,
    channel: "telegram",
    reason:
      "Telegram указан в окружении, но адаптер Bot API ещё не подключён. Сообщение не отправлено.",
  };
}

export async function sendOrThrow(input: {
  channel: NotifyChannel;
  to?: string | null;
  subject: string;
  text: string;
}): Promise<void> {
  const result = await sendNotification(input);
  if (!result.ok) {
    throw new IntegrationNotConfiguredError(`notifications:${input.channel}`);
  }
}
