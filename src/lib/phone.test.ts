import assert from "node:assert/strict";
import { test } from "node:test";
import { applyPhoneEdit, formatPhone, isCompletePhone } from "./phone.ts";
import { hasErrors, validateCallback, validateQuote } from "./validation.ts";

test("formats a local Belarus mobile as +375", () => {
  assert.equal(formatPhone("297920786"), "+375 (29) 792-07-86");
});

test("keeps an international number and the domestic 80 prefix", () => {
  assert.equal(formatPhone("375297920786999"), "+375 (29) 792-07-86");
  assert.equal(formatPhone("80297920786"), "+375 (29) 792-07-86");
});

test("keeps an already formatted number stable", () => {
  assert.equal(formatPhone("+375 (29) 792-07-86"), "+375 (29) 792-07-86");
});

test("types a number through the mask", () => {
  let value = "";
  for (const char of "297920786") {
    value = applyPhoneEdit(value, value + char);
  }
  assert.equal(value, "+375 (29) 792-07-86");
  assert.equal(isCompletePhone(value), true);
});

test("backspace on a mask character removes a digit", () => {
  assert.equal(applyPhoneEdit("+375 (29) ", "+375 (29)"), "+375 (2");
});

test("clears the field when digits are gone", () => {
  assert.equal(applyPhoneEdit("+375", ""), "");
  assert.equal(isCompletePhone("+375 (29)"), false);
});

test("requires a complete phone and the quote fields", () => {
  const errors = validateQuote({ ...validInput(), brand: "", year: "", part: " ", phone: "+375 (29)", vin: "" });
  assert.equal(hasErrors(errors), true);
  assert.equal(errors.phone, "Введите телефон полностью");
  assert.equal(errors.brand, "Выберите марку");

  const incomplete = validateQuote({
    brand: "Jeep",
    model: "",
    year: "2018",
    part: "редуктор",
    vin: "",
    oem: "",
    condition: "",
    phone: "+375 (29) 792-07-86",
  });
  assert.equal(incomplete.model, "Укажите модель");
  assert.equal(incomplete.vin, "Укажите VIN или OEM");
  const valid = validateQuote({ ...validInput(), vin: "1FMCU9GD5JUA00001" });
  assert.equal(hasErrors(valid), false);
  const byOem = validateQuote({ ...validInput(), oem: "FB5Z13008A" });
  assert.equal(hasErrors(byOem), false);
  assert.equal(
    validateQuote({ ...validInput(), vin: "IO" }).vin,
    "VIN состоит из 17 знаков, без букв I, O и Q",
  );
});

function validInput() {
  return {
    brand: "Jeep",
    model: "Grand Cherokee",
    year: "2018",
    part: "редуктор",
    vin: "",
    oem: "",
    condition: "" as const,
    phone: "+375 (29) 792-07-86",
  };
}

test("callback form requires only the phone", () => {
  assert.equal(hasErrors(validateCallback("")), true);
  assert.equal(hasErrors(validateCallback("+375 (29) 792-07-86")), false);
});
