import nodemailer from "nodemailer";

export const LEAD_INBOX = "dmitry.chanoff@gmail.com";

export function smtpSettings(env) {
  const pass = String(env.SMTP_PASS ?? "").trim();
  if (!pass) return null;
  const user = env.SMTP_USER?.trim() || LEAD_INBOX;
  const host = env.SMTP_HOST?.trim() || (user.endsWith("@gmail.com") ? "smtp.gmail.com" : "");
  const to = env.LEAD_TO?.trim() || LEAD_INBOX;
  const from = env.SMTP_FROM?.trim() || user;
  const port = Number(env.SMTP_PORT || 587);
  if (!host || !user || !to || !from || !Number.isInteger(port)) return null;
  return { host, port, user, pass, to, from };
}

export function createSmtpMailer(env) {
  const settings = smtpSettings(env);
  if (!settings) return null;
  const transport = nodemailer.createTransport({
    host: settings.host,
    port: settings.port,
    secure: settings.port === 465,
    auth: { user: settings.user, pass: settings.pass },
  });
  return {
    async send({ subject, text }) {
      await transport.sendMail({ from: settings.from, to: settings.to, subject, text });
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
