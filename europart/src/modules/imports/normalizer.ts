import type { OfferAvailability } from "@/generated/prisma/client";
import { normalizeArticle } from "@/modules/search/normalize-article";
import type { ColumnMapping, ImportFieldId } from "@/modules/imports/fields";
import { parseMoney } from "@/modules/imports/money";
import type { ParsedRow } from "@/modules/imports/parser";

const availabilityValues = [
  "IN_STOCK",
  "LOW_STOCK",
  "ON_ORDER",
  "INCOMING",
  "OUT_OF_STOCK",
  "DISCONTINUED",
  "UNKNOWN",
] as const satisfies readonly OfferAvailability[];

export type NormalizedRow = {
  article: string | null;
  articleNormalized: string | null;
  oem: string | null;
  oemNormalized: string | null;
  extraArticle: string | null;
  extraNormalized: string | null;
  partBrand: string | null;
  brandKey: string | null;
  name: string | null;
  description: string | null;
  category: string | null;
  purchasePrice: string | null;
  retailPrice: string | null;
  currency: string | null;
  quantity: number | null;
  availability: OfferAvailability | null;
  leadTime: number | null;
  imageUrl: string | null;
  provided: Record<ImportFieldId, boolean>;
  warnings: string[];
  errors: string[];
};

const availabilityWords = new Map<string, OfferAvailability>([
  ["вналичии", "IN_STOCK"],
  ["есть", "IN_STOCK"],
  ["instock", "IN_STOCK"],
  ["available", "IN_STOCK"],
  ["да", "IN_STOCK"],
  ["мало", "LOW_STOCK"],
  ["малонаскладе", "LOW_STOCK"],
  ["low", "LOW_STOCK"],
  ["lowstock", "LOW_STOCK"],
  ["подзаказ", "ON_ORDER"],
  ["заказ", "ON_ORDER"],
  ["onorder", "ON_ORDER"],
  ["ожидается", "INCOMING"],
  ["впути", "INCOMING"],
  ["incoming", "INCOMING"],
  ["нет", "OUT_OF_STOCK"],
  ["нетвналичии", "OUT_OF_STOCK"],
  ["outofstock", "OUT_OF_STOCK"],
  ["снят", "DISCONTINUED"],
  ["снятспродажи", "DISCONTINUED"],
  ["discontinued", "DISCONTINUED"],
  ["неизвестно", "UNKNOWN"],
  ["уточнить", "UNKNOWN"],
  ["unknown", "UNKNOWN"],
]);

function emptyProvided(): Record<ImportFieldId, boolean> {
  return {
    article: false,
    oem: false,
    extraArticle: false,
    partBrand: false,
    name: false,
    description: false,
    category: false,
    purchasePrice: false,
    retailPrice: false,
    currency: false,
    quantity: false,
    availability: false,
    leadTime: false,
    imageUrl: false,
  };
}

function wordKey(value: string): string {
  return value
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s._\-/\\]+/g, "");
}

function cleanText(value: string, limit: number): string {
  return value
    .normalize("NFKC")
    .replace(/\u00A0/g, " ")
    .trim()
    .slice(0, limit);
}

function readArticle(
  value: string,
  numeric: boolean,
  label: string,
  warnings: string[],
  errors: string[],
): { raw: string | null; normalized: string | null } {
  const raw = cleanText(value, 80);
  if (!raw) {
    return { raw: null, normalized: null };
  }
  if (numeric) {
    warnings.push(
      `${label} прочитан как число. Если в начале были нули, Excel уже удалил их. Сохраните колонку как текст.`,
    );
  }
  if (/e\+/i.test(raw)) {
    errors.push(`${label} похож на число в научной записи. Сохраните колонку как текст.`);
  }
  const normalized = normalizeArticle(raw);
  if (!normalized) {
    errors.push(`${label} не содержит букв или цифр.`);
    return { raw, normalized: null };
  }
  return { raw, normalized };
}

function blockedHost(hostname: string): boolean {
  const host = hostname.replace(/^\[|\]$/g, "").toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host.endsWith(".local") ||
    host.endsWith(".internal") ||
    host === "metadata.google.internal" ||
    host === "0.0.0.0" ||
    host === "::1"
  ) {
    return true;
  }
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (!ipv4) {
    return (
      host.includes(":") &&
      (host.startsWith("fc") || host.startsWith("fd") || host.startsWith("fe80"))
    );
  }
  const parts = ipv4.slice(1).map(Number);
  if (parts.some((part) => part > 255)) {
    return true;
  }
  const [a, b] = parts;
  if (a === 10 || a === 127 || a === 0 || (a === 169 && b === 254)) {
    return true;
  }
  if ((a === 192 && b === 168) || (a === 172 && b >= 16 && b <= 31)) {
    return true;
  }
  return a === 100 && b >= 64 && b <= 127;
}

function readImage(value: string, errors: string[]): string | null {
  const raw = value.trim();
  if (!raw) {
    return null;
  }
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    errors.push("Ссылка на фото некорректна.");
    return null;
  }
  if (
    url.protocol !== "https:" ||
    url.username ||
    url.password ||
    blockedHost(url.hostname)
  ) {
    errors.push(
      "Фото принимается только по https с публичного адреса. Файл не скачивается.",
    );
    return null;
  }
  if (url.toString().length > 2000) {
    errors.push("Ссылка на фото слишком длинная.");
    return null;
  }
  return url.toString();
}

export function readMapped(
  row: ParsedRow,
  headers: string[],
  mapping: ColumnMapping,
): Partial<Record<ImportFieldId, { text: string; numeric: boolean }>> {
  const values: Partial<Record<ImportFieldId, { text: string; numeric: boolean }>> = {};
  headers.forEach((header, index) => {
    const field = mapping[header];
    if (!field) {
      return;
    }
    values[field] = {
      text: row.cells[index] ?? "",
      numeric: row.numeric[index] ?? false,
    };
  });
  return values;
}

export const ImportNormalizer = {
  normalize(input: {
    row: ParsedRow;
    headers: string[];
    mapping: ColumnMapping;
  }): NormalizedRow {
    const source = readMapped(input.row, input.headers, input.mapping);
    const provided = emptyProvided();
    const warnings: string[] = [];
    const errors: string[] = [];
    const text = (field: ImportFieldId) => source[field]?.text ?? "";
    const mark = (field: ImportFieldId) => {
      provided[field] = text(field).trim() !== "";
      return provided[field];
    };

    const article = mark("article")
      ? readArticle(
          text("article"),
          source.article?.numeric ?? false,
          "Артикул",
          warnings,
          errors,
        )
      : { raw: null, normalized: null };
    const oem = mark("oem")
      ? readArticle(text("oem"), source.oem?.numeric ?? false, "OEM", warnings, errors)
      : { raw: null, normalized: null };
    const extra = mark("extraArticle")
      ? readArticle(
          text("extraArticle"),
          source.extraArticle?.numeric ?? false,
          "Дополнительный артикул",
          warnings,
          errors,
        )
      : { raw: null, normalized: null };

    const name = mark("name") ? cleanText(text("name"), 300) : null;
    const description = mark("description") ? cleanText(text("description"), 5000) : null;
    const category = mark("category") ? cleanText(text("category"), 160) : null;
    const partBrand = mark("partBrand") ? cleanText(text("partBrand"), 120) : null;
    if (name === "") {
      errors.push("Название пустое.");
    }
    if (partBrand === "") {
      errors.push("Бренд пустой.");
    }

    let purchasePrice: string | null = null;
    let retailPrice: string | null = null;
    if (mark("purchasePrice")) {
      const money = parseMoney(text("purchasePrice"));
      if (money.ok) {
        purchasePrice = money.value;
      } else {
        errors.push(`Закупка: ${money.message}`);
      }
    }
    if (mark("retailPrice")) {
      const money = parseMoney(text("retailPrice"));
      if (money.ok) {
        retailPrice = money.value;
      } else {
        errors.push(`Розница: ${money.message}`);
      }
    }

    let currency: string | null = null;
    if (mark("currency")) {
      const code = text("currency").trim().toUpperCase();
      if (/^[A-Z]{3}$/.test(code)) {
        currency = code;
      } else {
        errors.push("Валюта должна состоять из трёх латинских букв, например BYN.");
      }
    } else if (purchasePrice || retailPrice) {
      currency = "BYN";
      provided.currency = true;
      warnings.push("Валюта не указана, для строки сохранена BYN.");
    }

    let quantity: number | null = null;
    if (mark("quantity")) {
      const compact = text("quantity").replace(/\s/g, "").replace(",", ".");
      if (!/^\d+(\.0+)?$/.test(compact)) {
        errors.push("Количество должно быть целым числом от 0.");
      } else {
        quantity = Number(compact);
        if (quantity > 1_000_000) {
          errors.push("Количество слишком большое.");
          quantity = null;
        }
      }
    }

    let availability: OfferAvailability | null = null;
    if (mark("availability")) {
      const resolved = availabilityWords.get(wordKey(text("availability")));
      if (!resolved || !availabilityValues.includes(resolved)) {
        errors.push("Статус наличия не распознан.");
      } else {
        availability = resolved;
      }
    } else if (quantity === 0) {
      availability = "OUT_OF_STOCK";
      provided.availability = true;
      warnings.push("Количество 0 сохранено как «нет в наличии».");
    } else if (quantity !== null && quantity > 0) {
      availability = "IN_STOCK";
      provided.availability = true;
      warnings.push("Количество больше нуля сохранено как «в наличии».");
    }

    let leadTime: number | null = null;
    if (mark("leadTime")) {
      const match = /^(\d{1,3})/.exec(text("leadTime").trim());
      const days = match ? Number(match[1]) : Number.NaN;
      if (
        !Number.isInteger(days) ||
        days > 365 ||
        !/^\d{1,3}$/.test(text("leadTime").trim())
      ) {
        errors.push("Срок поставки укажите одним числом дней от 0 до 365.");
      } else {
        leadTime = days;
      }
    }

    const imageUrl = mark("imageUrl") ? readImage(text("imageUrl"), errors) : null;

    return {
      article: article.raw,
      articleNormalized: article.normalized,
      oem: oem.raw,
      oemNormalized: oem.normalized,
      extraArticle: extra.raw,
      extraNormalized: extra.normalized,
      partBrand: partBrand || null,
      brandKey: partBrand ? normalizeArticle(partBrand) : null,
      name: name || null,
      description: description || null,
      category: category || null,
      purchasePrice,
      retailPrice,
      currency,
      quantity,
      availability,
      leadTime,
      imageUrl,
      provided,
      warnings,
      errors,
    };
  },
};
