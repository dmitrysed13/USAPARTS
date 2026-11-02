export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeRuDigits(digits: string): string {
  let normalized = digits;
  if (!normalized) return "";
  if (normalized.startsWith("8")) normalized = `7${normalized.slice(1)}`;
  if (!normalized.startsWith("7")) normalized = `7${normalized}`;
  return normalized.slice(0, 11);
}

export function formatPhone(raw: string): string {
  const digits = normalizeRuDigits(onlyDigits(raw));
  if (!digits) return "";

  const rest = digits.slice(1);
  let formatted = "+7";
  if (rest.length === 0) return formatted;

  formatted += ` (${rest.slice(0, 3)}`;
  if (rest.length < 3) return formatted;

  formatted += `) ${rest.slice(3, 6)}`;
  if (rest.length <= 6) return formatted;

  formatted += `-${rest.slice(6, 8)}`;
  if (rest.length <= 8) return formatted;

  formatted += `-${rest.slice(8, 10)}`;
  return formatted;
}

export function isCompletePhone(value: string): boolean {
  return normalizeRuDigits(onlyDigits(value)).length === 11;
}

export function isPhoneEmpty(value: string): boolean {
  return normalizeRuDigits(onlyDigits(value)).length <= 1;
}

export function applyPhoneEdit(previous: string, incoming: string): string {
  if (onlyDigits(incoming).length === 0) return "";

  const previousDigits = normalizeRuDigits(onlyDigits(previous));
  const nextDigits = normalizeRuDigits(onlyDigits(incoming));
  const deletedMaskCharacter =
    incoming.length < previous.length && nextDigits === previousDigits && previousDigits.length > 1;

  if (deletedMaskCharacter) return formatPhone(previousDigits.slice(0, -1));
  return formatPhone(incoming);
}
