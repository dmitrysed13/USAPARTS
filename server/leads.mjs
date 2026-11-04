import { createHash } from "node:crypto";

const WINDOW_MS = 10 * 60 * 1000;
const DUPLICATE_MS = 2 * 60 * 1000;
const LIMIT = 5;

export function createLeadState() {
  return { hits: new Map(), seen: new Map() };
}

export const leadState = createLeadState();

function digits(value) {
  return String(value ?? "").replace(/\D/g, "");
}

function phoneOk(value) {
  const raw = digits(value);
  const normalized = raw.startsWith("375") ? raw.slice(0, 12) : raw.startsWith("80") ? `375${raw.slice(2)}`.slice(0, 12) : `375${raw}`.slice(0, 12);
  return normalized.length === 12;
}

function vinOk(value) {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(String(value ?? "").trim().toUpperCase());
}

function clip(value, max) {
  return String(value ?? "").trim().slice(0, max);
}

export function parseLead(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) return { error: "invalid" };
  const kind = body.kind === "callback" ? "callback" : body.kind === "quote" ? "quote" : "";
  if (!kind) return { error: "invalid" };
  const phone = clip(body.phone, 24);
  if (!phoneOk(phone)) return { error: "phone" };
  const page = clip(body.page, 180);
  if (!page.startsWith("/")) return { error: "page" };
  const lead = {
    kind,
    phone,
    page,
    name: clip(body.name, 80),
    brand: clip(body.brand, 40),
    model: clip(body.model, 80),
    year: clip(body.year, 4),
    part: clip(body.part, 200),
    vin: clip(body.vin, 17).toUpperCase(),
    oem: clip(body.oem, 40),
    condition: body.condition === "Новая" || body.condition === "Б/у" ? body.condition : "",
    time: clip(body.time, 40),
    comment: clip(body.comment, 1000),
  };
  if (kind === "callback") return { lead };
  if (lead.brand.length < 2 || lead.model.length < 1 || !/^\d{4}$/.test(lead.year) || lead.part.length < 2) return { error: "fields" };
  if (lead.vin && !vinOk(lead.vin)) return { error: "vin" };
  if (lead.oem && lead.oem.length < 3) return { error: "oem" };
  if (!vinOk(lead.vin) && lead.oem.length < 3) return { error: "reference" };
  return { lead };
}

export function leadText(lead) {
  const title = lead.kind === "callback" ? "Заказ звонка" : "Подбор детали";
  const rows = [
    ["Тип заявки", title],
    ["Телефон", lead.phone],
    ["Имя", lead.name],
    ["Марка", lead.brand],
    ["Модель", lead.model],
    ["Год", lead.year],
    ["Деталь", lead.part],
    ["VIN", lead.vin],
    ["OEM / артикул", lead.oem],
    ["Состояние", lead.condition],
    ["Удобное время", lead.time],
    ["Комментарий", lead.comment],
    ["Страница", lead.page],
  ];
  return {
    subject: `USAPARTS — ${title}`,
    text: rows
      .filter(([, value]) => value)
      .map(([name, value]) => `${name}: ${value}`)
      .join("\n"),
  };
}

function fingerprint(lead) {
  return createHash("sha256").update(JSON.stringify(lead)).digest("hex");
}

export async function processLead({ body, ip, now, mailer, telegram, state, log = () => {} }) {
  if (body && typeof body === "object" && String(body.company ?? "").trim()) {
    log({ event: "lead", result: "honeypot" });
    return { status: 200, body: { ok: true } };
  }
  const parsed = parseLead(body);
  if (parsed.error || !parsed.lead) {
    log({ event: "lead", result: "rejected" });
    return { status: 400, body: { ok: false, error: "invalid" } };
  }
  const lead = parsed.lead;
  const key = ip || "unknown";
  const recent = (state.hits.get(key) ?? []).filter((stamp) => now - stamp < WINDOW_MS);
  if (recent.length >= LIMIT) {
    state.hits.set(key, recent);
    log({ event: "lead", result: "limited", kind: lead.kind });
    return { status: 429, body: { ok: false, error: "limited" } };
  }
  const signature = fingerprint(lead);
  const previous = state.seen.get(signature);
  if (previous && now - previous < DUPLICATE_MS) {
    log({ event: "lead", result: "duplicate", kind: lead.kind });
    return { status: 200, body: { ok: true, duplicate: true } };
  }
  if (!mailer && !telegram) {
    log({ event: "lead", result: "unconfigured", kind: lead.kind });
    return { status: 503, body: { ok: false, error: "unconfigured" } };
  }
  const message = leadText(lead);
  let delivered = false;
  if (telegram) {
    try {
      await telegram(message.text);
      delivered = true;
    } catch {
      log({ event: "lead", result: "telegram_failed", kind: lead.kind });
    }
  }
  if (mailer) {
    try {
      await mailer.send(message);
      delivered = true;
    } catch {
      log({ event: "lead", result: "failed", kind: lead.kind });
    }
  }
  if (!delivered) {
    recent.push(now);
    state.hits.set(key, recent);
    log({ event: "lead", result: "undelivered", kind: lead.kind });
    return { status: 502, body: { ok: false, error: "delivery" } };
  }
  recent.push(now);
  state.hits.set(key, recent);
  state.seen.set(signature, now);
  log({ event: "lead", result: "sent", kind: lead.kind });
  return { status: 200, body: { ok: true } };
}
