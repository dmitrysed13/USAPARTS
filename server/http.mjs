import { createTelegram, createSmtpMailer } from "./smtp.mjs";
import { leadState, processLead } from "./leads.mjs";

export function clientIp(headers, socket, trustProxy) {
  if (trustProxy) {
    const forwarded = headers["x-forwarded-for"];
    const value = Array.isArray(forwarded) ? forwarded[0] : forwarded;
    const first = String(value ?? "").split(",")[0]?.trim();
    if (first) return first;
  }
  return socket?.remoteAddress || "unknown";
}

export async function readJson(req, limit = 10_000) {
  if (typeof req.body === "string") return req.body ? JSON.parse(req.body) : {};
  if (req.body && typeof req.body === "object") return req.body;
  const raw = await new Promise((resolve, reject) => {
    const chunks = [];
    let size = 0;
    req.on("data", (chunk) => {
      size += chunk.length;
      if (size > limit) {
        reject(new Error("too_large"));
        req.destroy();
        return;
      }
      chunks.push(chunk);
    });
    req.on("end", () => resolve(Buffer.concat(chunks).toString("utf8")));
    req.on("error", reject);
  });
  if (!raw) return {};
  return JSON.parse(raw);
}

export async function handleLeadRequest(req, env = process.env) {
  let body = null;
  try {
    body = await readJson(req);
  } catch {
    return { status: 400, body: { ok: false, error: "invalid" } };
  }
  return processLead({
    body,
    ip: clientIp(req.headers ?? {}, req.socket, env.TRUST_PROXY === "1"),
    now: Date.now(),
    mailer: createSmtpMailer(env),
    telegram: createTelegram(env),
    state: leadState,
    log: (entry) => console.info(JSON.stringify(entry)),
  });
}
