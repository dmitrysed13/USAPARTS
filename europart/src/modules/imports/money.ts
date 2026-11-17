export type MoneyResult = { ok: true; value: string } | { ok: false; message: string };

const MAX_INTEGER_DIGITS = 10;

export function parseMoney(raw: string): MoneyResult {
  const compact = raw
    .normalize("NFKC")
    .trim()
    .replace(/[\s\u00A0]/g, "");
  if (!compact) {
    return { ok: false, message: "Пустая цена." };
  }
  if (compact.startsWith("-")) {
    return { ok: false, message: "Цена не может быть отрицательной." };
  }
  const numeric = compact.replace(/[^\d.,]/g, "");
  if (!numeric || !/\d/.test(numeric)) {
    return { ok: false, message: "Некорректная цена." };
  }

  const hasDot = numeric.includes(".");
  const hasComma = numeric.includes(",");
  let integer = "";
  let fraction = "";

  if (hasDot && hasComma) {
    const lastDot = numeric.lastIndexOf(".");
    const lastComma = numeric.lastIndexOf(",");
    const decimalSep = lastDot > lastComma ? "." : ",";
    const thousandSep = decimalSep === "." ? "," : ".";
    const parts = numeric.split(decimalSep);
    fraction = parts.pop() ?? "";
    integer = parts.join(decimalSep).split(thousandSep).join("");
  } else if (hasDot || hasComma) {
    const separator = hasDot ? "." : ",";
    const bits = numeric.split(separator);
    if (bits.length > 2) {
      if (
        bits.some((part) => part === "") ||
        bits.slice(1).some((part) => part.length !== 3)
      ) {
        return { ok: false, message: "Некорректная цена." };
      }
      integer = bits.join("");
      fraction = "00";
    } else {
      const [whole, tail] = bits;
      if (!whole || tail === undefined) {
        return { ok: false, message: "Некорректная цена." };
      }
      if (tail.length === 3 && whole.length <= 3 && !whole.startsWith("0")) {
        integer = `${whole}${tail}`;
        fraction = "00";
      } else if (tail.length <= 2) {
        integer = whole;
        fraction = tail.padEnd(2, "0");
      } else {
        return {
          ok: false,
          message: "У цены может быть не больше двух знаков после запятой.",
        };
      }
    }
  } else {
    integer = numeric;
    fraction = "00";
  }

  if (!/^\d+$/.test(integer) || !/^\d{2}$/.test(fraction)) {
    return { ok: false, message: "Некорректная цена." };
  }
  if (fraction.length > 2) {
    return {
      ok: false,
      message: "У цены может быть не больше двух знаков после запятой.",
    };
  }
  const normalizedInteger = integer.replace(/^0+(?=\d)/, "");
  if (normalizedInteger.length > MAX_INTEGER_DIGITS) {
    return { ok: false, message: "Цена слишком большая." };
  }
  return { ok: true, value: `${normalizedInteger}.${fraction}` };
}
