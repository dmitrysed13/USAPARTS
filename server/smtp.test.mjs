import assert from "node:assert/strict";
import { test } from "node:test";
import { LEAD_INBOX, smtpSettings } from "./smtp.mjs";

test("gmail inbox is the default recipient and needs only the app password", () => {
  const settings = smtpSettings({ SMTP_PASS: "app-password" });
  assert.equal(settings.to, LEAD_INBOX);
  assert.equal(settings.user, LEAD_INBOX);
  assert.equal(settings.from, LEAD_INBOX);
  assert.equal(settings.host, "smtp.gmail.com");
  assert.equal(settings.port, 587);
});

test("missing password does not create a mailer config", () => {
  assert.equal(smtpSettings({}), null);
  assert.equal(smtpSettings({ SMTP_HOST: "smtp.gmail.com", SMTP_USER: LEAD_INBOX, LEAD_TO: LEAD_INBOX }), null);
});
