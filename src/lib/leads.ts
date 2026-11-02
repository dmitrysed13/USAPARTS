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

const STORAGE_KEY = "usaparts-leads";

export async function submitLead(lead: Lead, trap: string): Promise<void> {
  if (trap.trim()) return;

  try {
    const previous = sessionStorage.getItem(STORAGE_KEY);
    const list = previous ? (JSON.parse(previous) as Lead[]) : [];
    list.push(lead);
    sessionStorage.setItem(STORAGE_KEY, JSON.stringify(list));
  } catch {
    // Private mode can block sessionStorage. The webhook below is still attempted.
  }

  const webhook = import.meta.env.VITE_LEAD_WEBHOOK;
  if (!webhook) return;

  const response = await fetch(webhook, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(lead),
  });

  if (!response.ok) {
    throw new Error("Не удалось отправить заявку. Позвоните нам или напишите в мессенджер.");
  }
}
