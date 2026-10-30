const TRANSLIT: Record<string, number> = {
  A: 1, B: 2, C: 3, D: 4, E: 5, F: 6, G: 7, H: 8,
  J: 1, K: 2, L: 3, M: 4, N: 5, P: 7, R: 9,
  S: 2, T: 3, U: 4, V: 5, W: 6, X: 7, Y: 8, Z: 9,
};

const WEIGHTS = [8, 7, 6, 5, 4, 3, 2, 10, 0, 9, 8, 7, 6, 5, 4, 3, 2];

export type VinValidation = { ok: true; vin: string } | { ok: false; vin: string; reason: string };

function valueOf(char: string) {
  if (char >= "0" && char <= "9") return Number(char);
  return TRANSLIT[char] ?? null;
}

export function vinCheckDigit(vin: string) {
  let sum = 0;
  for (let i = 0; i < 17; i++) {
    const value = valueOf(vin[i] ?? "");
    if (value == null) return null;
    sum += value * WEIGHTS[i]!;
  }
  const mod = sum % 11;
  return mod === 10 ? "X" : String(mod);
}

export function validateVin(input: string): VinValidation {
  const vin = input.toUpperCase().trim();
  if (vin.length !== 17) {
    return { ok: false, vin, reason: "VIN должен содержать 17 символов." };
  }
  if (!/^[A-HJ-NPR-Z0-9]{17}$/.test(vin)) {
    return { ok: false, vin, reason: "В VIN не используются буквы I, O и Q." };
  }
  const expected = vinCheckDigit(vin);
  if (!expected || vin[8] !== expected) {
    return { ok: false, vin, reason: "Контрольная цифра VIN не сходится. Проверьте номер на табличке." };
  }
  return { ok: true, vin };
}
