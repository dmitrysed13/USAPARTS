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
const TELEGRAM_USER = "dmitry_spa";

export class TelegramHandoff extends Error {
  readonly href: string;
  readonly text: string;

  constructor(text: string) {
    super("Откройте Telegram");
    this.name = "TelegramHandoff";
    this.text = text;
    this.href = `https://t.me/${TELEGRAM_USER}?text=${encodeURIComponent(text)}`;
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

export async function submitLead(lead: Lead, trap: string): Promise<void> {
  const page = lead.page || (typeof location === "undefined" ? "/" : location.pathname);
  let response: Response;
  try {
    response = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        kind: lead.kind,
        phone: lead.phone,
        brand: lead.brand,
        model: lead.model,
        year: lead.year,
        part: lead.part,
        vin: lead.vin,
        oem: lead.oem,
        condition: lead.condition,
        name: lead.name,
        time: lead.time,
        comment: lead.comment,
        page,
        company: trap,
      }),
    });
  } catch (error) {
    if (error instanceof TelegramHandoff) throw error;
    throw new TelegramHandoff(leadMessage({ ...lead, page }));
  }

  let payload: { ok?: boolean } | null = null;
  try {
    payload = (await response.json()) as { ok?: boolean };
  } catch {
    payload = null;
  }
  if (response.ok && payload?.ok === true) return;
  if (response.status === 400 || response.status === 429) throw new Error(FAIL);
  throw new TelegramHandoff(leadMessage({ ...lead, page }));
}
