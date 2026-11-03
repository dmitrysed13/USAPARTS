import assert from "node:assert/strict";
import { test } from "node:test";
import { createLeadState, processLead } from "./leads.mjs";

const quote = {
  kind: "quote",
  phone: "+375 (29) 111-22-33",
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
  page: "/avtozapchasti/ford/mustang/",
};

function mailer() {
  const sent = [];
  return {
    sent,
    async send(message) {
      sent.push(message);
    },
  };
}

test("quote with VIN is accepted once and is not logged with the phone", async () => {
  const box = mailer();
  const logs = [];
  const state = createLeadState();
  const first = await processLead({ body: quote, ip: "10.0.0.1", now: 1_000, mailer: box, state, log: (entry) => logs.push(entry) });
  const second = await processLead({ body: quote, ip: "10.0.0.1", now: 2_000, mailer: box, state, log: (entry) => logs.push(entry) });
  assert.equal(first.status, 200);
  assert.equal(first.body.ok, true);
  assert.equal(second.body.duplicate, true);
  assert.equal(box.sent.length, 1);
  assert.match(box.sent[0].subject, /Подбор детали/);
  assert.match(box.sent[0].text, /1HGCM82633A123456/);
  assert.match(box.sent[0].text, /Mustang/);
  assert.equal(JSON.stringify(logs).includes("111-22-33"), false);
  assert.equal(JSON.stringify(logs).includes("1HGCM82633A123456"), false);
});

test("cost quote accepts OEM when VIN is empty", async () => {
  const box = mailer();
  const result = await processLead({
    body: { ...quote, vin: "", oem: "FR3Z16006A", part: "Фара", model: "Fusion", page: "/" },
    ip: "10.0.0.2",
    now: 1_000,
    mailer: box,
    state: createLeadState(),
  });
  assert.equal(result.status, 200);
  assert.match(box.sent[0].text, /FR3Z16006A/);
});

test("callback keeps the page and does not require a VIN", async () => {
  const box = mailer();
  const result = await processLead({
    body: { kind: "callback", phone: "+375 (29) 111-22-33", name: "Анна", page: "/avtozapchasti/honda/cr-v/" },
    ip: "10.0.0.3",
    now: 1_000,
    mailer: box,
    state: createLeadState(),
  });
  assert.equal(result.status, 200);
  assert.match(box.sent[0].text, /\/avtozapchasti\/honda\/cr-v\//);
  assert.match(box.sent[0].subject, /Заказ звонка/);
});

test("invalid quote and honeypot do not send mail", async () => {
  const box = mailer();
  const state = createLeadState();
  const invalid = await processLead({ body: { ...quote, vin: "", oem: "" }, ip: "10.0.0.4", now: 1_000, mailer: box, state });
  const hidden = await processLead({ body: { ...quote, company: "spam" }, ip: "10.0.0.4", now: 1_000, mailer: box, state });
  assert.equal(invalid.status, 400);
  assert.equal(invalid.body.ok, false);
  assert.equal(hidden.status, 200);
  assert.equal(box.sent.length, 0);
});

test("missing mail settings do not report success", async () => {
  const result = await processLead({ body: quote, ip: "10.0.0.5", now: 1_000, mailer: null, state: createLeadState() });
  assert.equal(result.status, 503);
  assert.equal(result.body.ok, false);
});

test("mail failure and the sixth request are not success", async () => {
  const state = createLeadState();
  const broken = { async send() { throw new Error("smtp down"); } };
  const failed = await processLead({ body: quote, ip: "10.9.9.9", now: 1_000, mailer: broken, state });
  assert.equal(failed.status, 502);
  assert.equal(failed.body.ok, false);
  const box = mailer();
  for (let index = 0; index < 5; index += 1) {
    const result = await processLead({
      body: { ...quote, phone: `+375 (29) 100-00-0${index}`, vin: `1HGCM82633A12345${index}` },
      ip: "10.8.8.8",
      now: 10_000 + index,
      mailer: box,
      state,
    });
    assert.equal(result.status, 200);
  }
  const limited = await processLead({
    body: { ...quote, phone: "+375 (29) 100-00-19", vin: "1HGCM82633A123450" },
    ip: "10.8.8.8",
    now: 20_000,
    mailer: box,
    state,
  });
  assert.equal(limited.status, 429);
  assert.equal(limited.body.ok, false);
});
