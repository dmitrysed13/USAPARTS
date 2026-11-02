import { isCompletePhone } from "./phone.ts";

export type QuoteDraft = {
  brand: string;
  year: string;
  part: string;
  phone: string;
};

export type QuoteSeed = {
  token: number;
  brand: string;
  part: string;
};

export type FieldErrors = Partial<Record<"brand" | "year" | "part" | "phone" | "name", string>>;

export function validateQuote(input: QuoteDraft): FieldErrors {
  const errors: FieldErrors = {};
  if (!input.brand) errors.brand = "Выберите марку";
  if (!input.year) errors.year = "Укажите год выпуска";
  if (input.part.trim().length < 2) errors.part = "Напишите деталь или VIN";
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
