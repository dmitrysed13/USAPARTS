export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

export function normalizeByDigits(digits: string): string {
  if (!digits) return "";
  if (digits === "3" || digits === "37") return digits;
  if (digits === "8") return "375";
  if (digits.startsWith("375")) return digits.slice(0, 12);
  if (digits.startsWith("80")) return `375${digits.slice(2)}`.slice(0, 12);
  return `375${digits}`.slice(0, 12);
}

export function formatPhone(raw: string): string {
  const digits = normalizeByDigits(onlyDigits(raw));
  if (!digits) return "";
  if (digits === "3" || digits === "37") return `+${digits}`;

  const rest = digits.slice(3);
  let formatted = "+375";
  if (rest.length === 0) return formatted;

  formatted += ` (${rest.slice(0, 2)}`;
  if (rest.length < 2) return formatted;

  formatted += `) ${rest.slice(2, 5)}`;
  if (rest.length <= 5) return formatted;

  formatted += `-${rest.slice(5, 7)}`;
  if (rest.length <= 7) return formatted;

  formatted += `-${rest.slice(7, 9)}`;
  return formatted;
}

export function isCompletePhone(value: string): boolean {
  return normalizeByDigits(onlyDigits(value)).length === 12;
}

export function isPhoneEmpty(value: string): boolean {
  return normalizeByDigits(onlyDigits(value)).length <= 3;
}

export function applyPhoneEdit(previous: string, incoming: string): string {
  if (onlyDigits(incoming).length === 0) return "";

  const previousDigits = normalizeByDigits(onlyDigits(previous));
  const nextDigits = normalizeByDigits(onlyDigits(incoming));
  const deletedMaskCharacter =
    incoming.length < previous.length && nextDigits === previousDigits && previousDigits.length > 3;

  if (deletedMaskCharacter) return formatPhone(previousDigits.slice(0, -1));
  return formatPhone(incoming);
}
