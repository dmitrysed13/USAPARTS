import assert from "node:assert/strict";
import { afterEach, test } from "node:test";
import { company } from "../content.ts";
import { MailHandoff, submitLead, type Lead } from "./leads.ts";

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

test("sends the lead to the company inbox when the server cannot mail it", async () => {
  const calls: Array<{ url: string; body: Record<string, string> }> = [];
  globalThis.fetch = (async (url: string | URL | Request, init?: RequestInit) => {
    calls.push({ url: String(url), body: JSON.parse(String(init?.body)) as Record<string, string> });
    if (String(url) === "/api/leads/") return new Response(JSON.stringify({ ok: false }), { status: 503 });
    return new Response(JSON.stringify({ success: "true" }), { status: 200 });
  }) as typeof fetch;

  await submitLead(lead, "");
  assert.equal(calls.length, 2);
  assert.equal(calls[1].url, `https://formsubmit.co/ajax/${company.email}`);
  assert.equal(calls[1].body.VIN, lead.vin);
  assert.equal(calls[1].body["Деталь"], "Капот");
  assert.equal(calls[1].body._subject, "USAPARTS — Подбор детали");
});

test("prepares a letter to the same inbox when direct delivery is blocked", async () => {
  globalThis.fetch = (async (url: string | URL | Request) => {
    if (String(url) === "/api/leads/") return new Response(JSON.stringify({ ok: false }), { status: 503 });
    return new Response("blocked", { status: 403 });
  }) as typeof fetch;
  const error = await submitLead(lead, "").then(
    () => null,
    (reason: unknown) => reason,
  );
  assert.ok(error instanceof MailHandoff);
  assert.match(error.href, new RegExp(`^mailto:${company.email.replace(".", "\\.")}\\?`));
  assert.match(decodeURIComponent(error.href), /1HGCM82633A123456/);
  assert.match(decodeURIComponent(error.gmail), new RegExp(company.email));
  assert.match(error.gmail, /^https:\/\/mail\.google\.com\/mail\/\?/);

  globalThis.fetch = (async () => {
    throw new Error("offline");
  }) as typeof fetch;
  await assert.rejects(submitLead(lead, ""), MailHandoff);
});

test("keeps a validation refusal as an error", async () => {
  const calls: string[] = [];
  globalThis.fetch = (async (url: string | URL | Request) => {
    calls.push(String(url));
    return new Response(JSON.stringify({ ok: false }), { status: 400 });
  }) as typeof fetch;
  await assert.rejects(submitLead(lead, ""), /Не удалось отправить заявку/);
  assert.deepEqual(calls, ["/api/leads/"]);
});
