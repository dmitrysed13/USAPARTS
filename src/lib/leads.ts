import { company } from "../content.ts";

export type LeadKind = "quote" | "callback";

export type Lead = {
  kind: LeadKind;
  phone: string;
  brand: string;
  year: string;
  part: string;
  name: string;
  time: string;
  comment: string;
  createdAt: string;
};

const ENDPOINT = `https://formsubmit.co/ajax/${company.email}`;

const FAIL = "Не удалось отправить заявку. Позвоните нам или напишите в мессенджер.";

function title(kind: LeadKind): string {
  return kind === "quote" ? "Подбор детали" : "Заказ звонка";
}

function sentAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return new Intl.DateTimeFormat("ru-RU", {
    timeZone: "Europe/Minsk",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(date);
}

export function leadMail(lead: Lead): Record<string, string> {
  const rows: Array<[string, string]> = [
    ["Тип заявки", title(lead.kind)],
    ["Телефон", lead.phone],
    ["Имя", lead.name],
    ["Марка", lead.brand],
    ["Год", lead.year],
    ["Деталь или VIN", lead.part],
    ["Удобное время", lead.time],
    ["Комментарий", lead.comment],
    ["Отправлено", sentAt(lead.createdAt)],
  ];
  const mail: Record<string, string> = {
    _subject: `USAPARTS — ${title(lead.kind)}`,
    _template: "table",
    _captcha: "false",
  };
  for (const [key, value] of rows) {
    const text = value.trim();
    if (text) mail[key] = text;
  }
  return mail;
}

export async function submitLead(lead: Lead, trap: string): Promise<void> {
  if (trap.trim()) return;

  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify(leadMail(lead)),
    });
  } catch {
    throw new Error(FAIL);
  }

  let payload: { success?: string | boolean } | null = null;
  try {
    payload = (await response.json()) as { success?: string | boolean };
  } catch {
    payload = null;
  }

  const accepted = response.ok && (payload?.success === true || payload?.success === "true");
  if (!accepted) throw new Error(FAIL);
}
