import { isCompletePhone } from "./phone.ts";

export type PartCondition = "" | "Новая" | "Б/у";

export type QuoteDraft = {
  brand: string;
  model: string;
  year: string;
  part: string;
  vin: string;
  oem: string;
  condition: PartCondition;
  phone: string;
};

export type QuoteSeed = {
  token: number;
  brand: string;
  part: string;
};

export type FieldErrors = Partial<Record<"brand" | "year" | "part" | "phone" | "name" | "vin" | "oem", string>>;

export function validateVin(value: string): boolean {
  return /^[A-HJ-NPR-Z0-9]{17}$/.test(value.trim().toUpperCase());
}

export function validateQuote(input: QuoteDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.brand) errors.brand = "Выберите марку";
  if (!input.year) errors.year = "Укажите год выпуска";
  if (input.part.trim().length < 2) errors.part = "Напишите название детали";
  if (input.vin.trim() && !validateVin(input.vin)) errors.vin = "VIN состоит из 17 знаков, без букв I, O и Q";
  if (input.oem.trim() && input.oem.trim().length < 3) errors.oem = "Артикул слишком короткий";
  if (!isCompletePhone(input.phone)) errors.phone = "Введите телефон полностью";
  return errors;
}

export function validateCallback(phone: string): FieldErrors {
  const errors: FieldErrors = {};
  if (!isCompletePhone(phone)) errors.phone = "Введите телефон полностью";
  return errors;
}

export function hasErrors(errors: FieldErrors): boolean {
  return Object.keys(errors).length > 0;
}
