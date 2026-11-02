import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { company } from "../content.ts";
import { leadMail, submitLead, type Lead } from "./leads.ts";

const lead: Lead = {
  kind: "quote",
  phone: "+375 (29) 792-07-86",
  brand: "Ford",
  model: "Explorer",
  year: "2018",
  part: "Фара левая",
  vin: "1FMCU9GD5JUA00001",
  oem: "FB5Z13008A",
  condition: "Новая",
  name: "Игорь",
  time: "После 18:00",
  comment: "Нужен оригинал",
  createdAt: "2026-11-02T13:00:00.000Z",
};

const originalFetch = globalThis.fetch;

afterEach(() => {
  globalThis.fetch = originalFetch;
});

test("builds a mail for the company inbox", () => {
  const mail = leadMail(lead);
  assert.equal(mail._subject, "USAPARTS — Подбор детали");
  assert.equal(mail["Телефон"], "+375 (29) 792-07-86");
  assert.equal(mail["Деталь"], "Фара левая");
  assert.equal(mail["VIN"], "1FMCU9GD5JUA00001");
  assert.match(mail["Отправлено"], /16:00/);
});

test("omits empty fields and names a callback", () => {
  const mail = leadMail({ ...lead, kind: "callback", brand: "  ", year: "", part: "", comment: "" });
  assert.equal(mail._subject, "USAPARTS — Заказ звонка");
  assert.equal(mail["Марка"], undefined);
  assert.equal(mail["Год"], undefined);
  assert.equal(mail["Комментарий"], undefined);
  assert.equal(mail["Имя"], "Игорь");
});

test("posts the quote to the company email", async () => {
  const calls: Array<{ url: string; body: Record<string, string> }> = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) as Record<string, string> });
    return new Response(JSON.stringify({ success: "true" }), { status: 200 });
  }) as typeof fetch;

  await submitLead(lead, "");

  assert.equal(calls.length, 1);
  assert.equal(calls[0].url, `https://formsubmit.co/ajax/${company.email}`);
  assert.equal(calls[0].body["Телефон"], lead.phone);
  assert.equal(calls[0].body._captcha, "false");
});

test("ignores a filled honeypot", async () => {
  let called = false;
  globalThis.fetch = (async () => {
    called = true;
    return new Response(JSON.stringify({ success: "true" }), { status: 200 });
  }) as typeof fetch;

  await submitLead(lead, "bot");
  assert.equal(called, false);
});

test("rejects a refused delivery", async () => {
  globalThis.fetch = (async () => new Response(JSON.stringify({ success: "false" }), { status: 200 })) as typeof fetch;
  await assert.rejects(submitLead(lead, ""), /Не удалось отправить заявку/);
});

test("rejects a network failure", async () => {
  globalThis.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;
  await assert.rejects(submitLead(lead, ""), /Не удалось отправить заявку/);
});
