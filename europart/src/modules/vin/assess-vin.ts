const STANDARD_VIN = /^[A-HJ-NPR-Z0-9]{17}$/;
const VIN_CHARSET = /^[A-Z0-9]+$/;

export type VinAssessment =
  | { ok: true; vin: string; standard: boolean; notice: string | null }
  | { ok: false; message: string };

export function assessVin(input: string): VinAssessment {
  const compact = input
    .normalize("NFKC")
    .toUpperCase()
    .replace(/[\s-]+/g, "");
  if (!compact) {
    return { ok: false, message: "Укажите VIN." };
  }
  if (!VIN_CHARSET.test(compact)) {
    return {
      ok: false,
      message: "VIN может содержать только латинские буквы и цифры.",
    };
  }
  if (compact.length < 6 || compact.length > 17) {
    return {
      ok: false,
      message:
        "Стандартный VIN состоит из 17 символов. Короче 6 или длиннее 17 заявка не сохраняется.",
    };
  }
  if (STANDARD_VIN.test(compact)) {
    return { ok: true, vin: compact, standard: true, notice: null };
  }

  const reasons: string[] = [];
  if (compact.length !== 17) {
    reasons.push("длина не 17 символов");
  }
  if (/[IOQ]/.test(compact)) {
    reasons.push("в стандартном VIN нет букв I, O и Q");
  }
  return {
    ok: true,
    vin: compact,
    standard: false,
    notice: `Номер сохранён, но не похож на стандартный VIN: ${reasons.join("; ")}. Менеджер проверит его вручную. Автоматической расшифровки нет.`,
  };
}
