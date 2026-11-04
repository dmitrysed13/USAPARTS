import nodemailer from "nodemailer";

export function createSmtpMailer(env) {
  const host = env.SMTP_HOST?.trim();
  const user = env.SMTP_USER?.trim();
  const pass = env.SMTP_PASS ?? "";
  const to = env.LEAD_TO?.trim();
  const from = env.SMTP_FROM?.trim() || user;
  const port = Number(env.SMTP_PORT || 587);
  if (!host || !user || !pass || !to || !from || !Number.isInteger(port)) return null;
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: { user, pass },
  });
  return {
    async send({ subject, text }) {
      await transport.sendMail({ from, to, subject, text });
    },
  };
}

export function createTelegram(env) {
  const token = env.TELEGRAM_BOT_TOKEN?.trim();
  const chat = env.TELEGRAM_CHAT_ID?.trim() || "@dmitry_spa";
  if (!token) return null;
  return async (text) => {
    const response = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chat, text }),
    });
    if (!response.ok) throw new Error("telegram");
  };
}
