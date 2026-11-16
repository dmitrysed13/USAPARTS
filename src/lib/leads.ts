import { company } from "../content.ts";

export type LeadKind = "quote" | "callback";

export type Lead = {
  kind: LeadKind;
  phone: string;
  brand: string;
  model: string;
  year: string;
  part: string;
  vin: string;
  oem: string;
  condition: string;
  name: string;
  time: string;
  comment: string;
  createdAt: string;
  page?: string;
};

const ENDPOINT = "/api/leads/";
const FAIL = "Не удалось отправить заявку. Позвоните нам или напишите в мессенджер.";
const INBOX = company.email;

export class MailHandoff extends Error {
  readonly href: string;
  readonly gmail: string;
  readonly text: string;

  constructor(lead: Lead) {
    const text = leadMessage(lead);
    const subject = lead.kind === "callback" ? "USAPARTS — Заказ звонка" : "USAPARTS — Подбор детали";
    super("Откройте письмо");
    this.name = "MailHandoff";
    this.text = text;
    this.href = `mailto:${INBOX}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
    this.gmail = `https://mail.google.com/mail/?view=cm&fs=1&tf=1&to=${encodeURIComponent(INBOX)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(text)}`;
  }
}

export function leadMessage(lead: Lead): string {
  const title = lead.kind === "callback" ? "Заказ звонка" : "Подбор детали";
  const rows: Array<[string, string]> = [
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
    ["Страница", lead.page || ""],
  ];
  return [`USAPARTS — ${title}`, ...rows.filter(([, value]) => value.trim()).map(([name, value]) => `${name}: ${value.trim()}`)].join("\n");
}

function leadFields(lead: Lead): Record<string, string> {
  const title = lead.kind === "callback" ? "Заказ звонка" : "Подбор детали";
  const fields: Record<string, string> = {
    _subject: `USAPARTS — ${title}`,
    _template: "table",
    _captcha: "false",
  };
  for (const [name, value] of [
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
    ["Страница", lead.page || ""],
  ] as const) {
    if (value.trim()) fields[name] = value.trim();
  }
  return fields;
}

async function deliverToInbox(lead: Lead, trap: string): Promise<void> {
  if (trap.trim()) return;
  try {
    const response = await fetch(`https://formsubmit.co/ajax/${INBOX}`, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(leadFields(lead)),
    });
    const payload = (await response.json().catch(() => null)) as { success?: boolean | string } | null;
    if (response.ok && (payload?.success === true || payload?.success === "true")) return;
  } catch {
    // The mailbox link below is the path that still addresses the same inbox.
  }
  throw new MailHandoff(lead);
}

export async function submitLead(lead: Lead, trap: string): Promise<void> {
  const page = lead.page || (typeof location === "undefined" ? "/" : location.pathname);
  const posted = { ...lead, page };
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        kind: posted.kind,
        phone: posted.phone,
        brand: posted.brand,
        model: posted.model,
        year: posted.year,
        part: posted.part,
        vin: posted.vin,
        oem: posted.oem,
        condition: posted.condition,
        name: posted.name,
        time: posted.time,
        comment: posted.comment,
        page,
        company: trap,
      }),
    });
  } catch (error) {
    if (error instanceof MailHandoff) throw error;
    await deliverToInbox(posted, trap);
    return;
  }

  let payload: { ok?: boolean } | null = null;
  try {
    payload = (await response.json()) as { ok?: boolean };
  } catch {
    payload = null;
  }
  if (response.ok && payload?.ok === true) return;
  if (response.status === 400 || response.status === 429) throw new Error(FAIL);
  await deliverToInbox(posted, trap);
}
