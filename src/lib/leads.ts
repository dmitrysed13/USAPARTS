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
  } catch {
    throw new Error(FAIL);
  }

  let payload: { ok?: boolean } | null = null;
  try {
    payload = (await response.json()) as { ok?: boolean };
  } catch {
    payload = null;
  }
  if (!(response.ok && payload?.ok === true)) throw new Error(FAIL);
}
