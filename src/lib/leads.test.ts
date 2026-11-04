import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { submitLead, TelegramHandoff, type Lead } from "./leads.ts";

const lead: Lead = {
  kind: "quote",
  phone: "+375 (29) 792-07-86",
  brand: "Ford",
  model: "Mustang",
  year: "2018",
  part: "Капот",
  vin: "1HGCM82633A123456",
  oem: "",
  condition: "Б/у",
  name: "",
  time: "",
  comment: "",
  createdAt: "2026-11-02T13:00:00.000Z",
  page: "/avtozapchasti/ford/mustang/",
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("posts the quote to the site endpoint and waits for acceptance", async () => {
  const calls: Array<{ url: string; body: Record<string, string> }> = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) as Record<string, string> });
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;

  await submitLead(lead, "");
  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, "/api/leads/");
  assert.equal(calls[0].body.vin, lead.vin);
  assert.equal(calls[0].body.page, lead.page);
  assert.equal(calls[0].body.company, "");
});

test("sends the honeypot to the server instead of pretending success locally", async () => {
  let body = "";
  globalThis.fetch = (async (_url: string | URL | Request, init?: RequestInit) => {
    body = String(init?.body);
    return new Response(JSON.stringify({ ok: true }), { status: 200 });
  }) as typeof fetch;
  await submitLead(lead, "bot");
  assert.match(body, /"company":"bot"/);
});

test("opens Telegram when the server cannot deliver", async () => {
  globalThis.fetch = (async () => new Response(JSON.stringify({ ok: false }), { status: 503 })) as typeof fetch;
  const error = await submitLead(lead, "").then(
    () => null,
    (reason: unknown) => reason,
  );
  assert.ok(error instanceof TelegramHandoff);
  assert.match(error.href, /^https:\/\/t\.me\/dmitry_spa\?text=/);
  assert.match(decodeURIComponent(error.href), /Капот/);
  assert.match(error.text, /1HGCM82633A123456/);

  globalThis.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;
  await assert.rejects(submitLead(lead, ""), TelegramHandoff);
});

test("keeps a validation refusal as an error", async () => {
  globalThis.fetch = (async () => new Response(JSON.stringify({ ok: false }), { status: 400 })) as typeof fetch;
  await assert.rejects(submitLead(lead, ""), /Не удалось отправить заявку/);
});
