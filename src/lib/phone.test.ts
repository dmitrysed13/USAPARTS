import assert from "node:assert/strict";
import { test } from "node:test";
import { applyPhoneEdit, formatPhone, isCompletePhone } from "./phone.ts";
import { hasErrors, validateCallback, validateQuote } from "./validation.ts";

test("formats a 10-digit mobile as +7", () => {
  assert.equal(formatPhone("9991234567"), "+7 (999) 123-45-67");
});

test("normalizes a leading 8 and ignores extra digits", () => {
  assert.equal(formatPhone("899912345679999"), "+7 (999) 123-45-67");
});

test("keeps an already formatted number stable", () => {
  assert.equal(formatPhone("+7 (999) 123-45-67"), "+7 (999) 123-45-67");
});

test("types a number through the mask", () => {
  let value = "";
  for (const char of "9991234567") {
    value = applyPhoneEdit(value, value + char);
  }
  assert.equal(value, "+7 (999) 123-45-67");
  assert.equal(isCompletePhone(value), true);
});

test("backspace on a mask character removes a digit", () => {
  assert.equal(applyPhoneEdit("+7 (999) ", "+7 (999)"), "+7 (99");
});

test("clears the field when digits are gone", () => {
  assert.equal(applyPhoneEdit("+7", ""), "");
  assert.equal(isCompletePhone("+7 (999)"), false);
});

test("requires a complete phone and the quote fields", () => {
  const errors = validateQuote({ brand: "", year: "", part: " ", phone: "+7 (999)" });
  assert.equal(hasErrors(errors), true);
  assert.equal(errors.phone, "Введите телефон полностью");
  assert.equal(errors.brand, "Выберите марку");

  const valid = validateQuote({
    brand: "Jeep",
    year: "2018",
    part: "редуктор",
    phone: "+7 (999) 123-45-67",
  });
  assert.equal(hasErrors(valid), false);
});

test("callback form requires only the phone", () => {
  assert.equal(hasErrors(validateCallback("")), true);
  assert.equal(hasErrors(validateCallback("+7 (999) 123-45-67")), false);
});
