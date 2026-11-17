export const importFieldIds = [
  "article",
  "oem",
  "extraArticle",
  "partBrand",
  "name",
  "description",
  "category",
  "purchasePrice",
  "retailPrice",
  "currency",
  "quantity",
  "availability",
  "leadTime",
  "imageUrl",
] as const;

export type ImportFieldId = (typeof importFieldIds)[number];

export const importFieldLabels: Record<ImportFieldId, string> = {
  article: "Артикул поставщика",
  oem: "OEM",
  extraArticle: "Дополнительный артикул",
  partBrand: "Бренд запчасти",
  name: "Название",
  description: "Описание",
  category: "Категория",
  purchasePrice: "Цена закупки",
  retailPrice: "Розничная цена",
  currency: "Валюта",
  quantity: "Количество",
  availability: "Статус наличия",
  leadTime: "Срок поставки, дни",
  imageUrl: "Фото URL",
};

const synonymToField = new Map<string, ImportFieldId>([
  ["артикулпоставщика", "article"],
  ["артикул", "article"],
  ["artikul", "article"],
  ["article", "article"],
  ["sku", "article"],
  ["код", "article"],
  ["oem", "oem"],
  ["оем", "oem"],
  ["номероем", "oem"],
  ["дополнительныйартикул", "extraArticle"],
  ["доп", "extraArticle"],
  ["кросс", "extraArticle"],
  ["кроссномер", "extraArticle"],
  ["cross", "extraArticle"],
  ["брендзапчасти", "partBrand"],
  ["бренд", "partBrand"],
  ["brand", "partBrand"],
  ["производитель", "partBrand"],
  ["наименование", "name"],
  ["название", "name"],
  ["name", "name"],
  ["товар", "name"],
  ["описание", "description"],
  ["description", "description"],
  ["категория", "category"],
  ["группа", "category"],
  ["category", "category"],
  ["ценазакупки", "purchasePrice"],
  ["закупочнаяцена", "purchasePrice"],
  ["purchaseprice", "purchasePrice"],
  ["закупка", "purchasePrice"],
  ["price", "purchasePrice"],
  ["цена", "purchasePrice"],
  ["розничнаяцена", "retailPrice"],
  ["retailprice", "retailPrice"],
  ["розница", "retailPrice"],
  ["валюта", "currency"],
  ["currency", "currency"],
  ["количество", "quantity"],
  ["колво", "quantity"],
  ["остаток", "quantity"],
  ["quantity", "quantity"],
  ["qty", "quantity"],
  ["статусналичия", "availability"],
  ["наличие", "availability"],
  ["availability", "availability"],
  ["срокпоставки", "leadTime"],
  ["срок", "leadTime"],
  ["leadtime", "leadTime"],
  ["фотоurl", "imageUrl"],
  ["фото", "imageUrl"],
  ["imageurl", "imageUrl"],
  ["image", "imageUrl"],
  ["picture", "imageUrl"],
]);

export type ColumnMapping = Partial<Record<string, ImportFieldId>>;

const blockedHeader = new Set(["__proto__", "prototype", "constructor"]);

export function headerKey(header: string): string {
  return header
    .normalize("NFKC")
    .toLowerCase()
    .replace(/[\s._\-/\\]+/g, "");
}

export function suggestMapping(headers: string[]): ColumnMapping {
  const mapping: ColumnMapping = {};
  const used = new Set<ImportFieldId>();
  for (const header of headers) {
    if (blockedHeader.has(header)) {
      continue;
    }
    const field = synonymToField.get(headerKey(header));
    if (!field || used.has(field)) {
      continue;
    }
    used.add(field);
    mapping[header] = field;
  }
  return mapping;
}

export function parseColumnMapping(input: unknown, headers: string[]): ColumnMapping {
  if (!input || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Сопоставление колонок передано в неверном виде.");
  }
  const known = new Set(headers);
  const mapping: ColumnMapping = {};
  const used = new Set<ImportFieldId>();
  for (const [header, field] of Object.entries(input)) {
    if (blockedHeader.has(header) || !known.has(header)) {
      continue;
    }
    if (typeof field !== "string" || field === "") {
      continue;
    }
    if (!importFieldIds.includes(field as ImportFieldId)) {
      throw new Error(`Неизвестное поле «${field}».`);
    }
    const typed = field as ImportFieldId;
    if (used.has(typed)) {
      throw new Error(`Поле «${importFieldLabels[typed]}» выбрано в двух колонках.`);
    }
    used.add(typed);
    mapping[header] = typed;
  }
  if (!used.has("article") && !used.has("oem")) {
    throw new Error("Сопоставьте колонку артикула или OEM.");
  }
  return mapping;
}
