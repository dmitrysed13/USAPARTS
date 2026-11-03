import ExcelJS from "exceljs";

export const MAX_IMPORT_BYTES = 5 * 1024 * 1024;
export const MAX_IMPORT_ROWS = 2000;
export const MAX_IMPORT_COLUMNS = 40;

export class ImportParserError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ImportParserError";
  }
}

export type ParsedRow = {
  line: number;
  cells: string[];
  numeric: boolean[];
};

export type ParsedTable = {
  headers: string[];
  rows: ParsedRow[];
  delimiter: "comma" | "semicolon" | "xlsx";
  sheetCount: number;
};

export type ImportDelimiter = "auto" | "comma" | "semicolon";

function uniqueHeaders(headers: string[]): string[] {
  const seen = new Map<string, number>();
  return headers.map((header, index) => {
    const label = header.trim() || `Колонка ${index + 1}`;
    const count = seen.get(label) ?? 0;
    seen.set(label, count + 1);
    return count === 0 ? label : `${label} (${count + 1})`;
  });
}

function assertShape(headers: string[], rowCount: number): void {
  if (headers.length === 0) {
    throw new ImportParserError("В файле нет строки с названиями колонок.");
  }
  if (headers.length > MAX_IMPORT_COLUMNS) {
    throw new ImportParserError(`В файле больше ${MAX_IMPORT_COLUMNS} колонок.`);
  }
  if (rowCount === 0) {
    throw new ImportParserError("В файле нет строк с данными.");
  }
  if (rowCount > MAX_IMPORT_ROWS) {
    throw new ImportParserError(
      `В файле больше ${MAX_IMPORT_ROWS} строк. Разделите прайс на части.`,
    );
  }
}

export function parseCsvText(text: string, delimiter: "," | ";"): string[][] {
  const source = text
    .replace(/^\uFEFF/, "")
    .replace(/\r\n/g, "\n")
    .replace(/\r/g, "\n");
  const matrix: string[][] = [];
  let row: string[] = [];
  let cell = "";
  let quoted = false;

  for (let index = 0; index < source.length; index += 1) {
    const char = source[index];
    if (quoted) {
      if (char === '"') {
        if (source[index + 1] === '"') {
          cell += '"';
          index += 1;
        } else {
          quoted = false;
        }
      } else {
        cell += char ?? "";
      }
      continue;
    }
    if (char === '"') {
      quoted = true;
    } else if (char === delimiter) {
      row.push(cell.trim());
      cell = "";
    } else if (char === "\n") {
      row.push(cell.trim());
      matrix.push(row);
      row = [];
      cell = "";
    } else {
      cell += char ?? "";
    }
  }
  if (cell.length > 0 || row.length > 0) {
    row.push(cell.trim());
    matrix.push(row);
  }
  return matrix;
}

function sniffDelimiter(text: string): "," | ";" {
  const sample = text.replace(/^\uFEFF/, "").split(/\r?\n/, 1)[0] ?? "";
  let commas = 0;
  let semicolons = 0;
  let quoted = false;
  for (let index = 0; index < sample.length; index += 1) {
    const char = sample[index];
    if (char === '"') {
      quoted = !quoted;
    } else if (!quoted && char === ",") {
      commas += 1;
    } else if (!quoted && char === ";") {
      semicolons += 1;
    }
  }
  return semicolons > commas ? ";" : ",";
}

function tableFromMatrix(
  matrix: string[][],
  delimiter: ParsedTable["delimiter"],
): ParsedTable {
  const filled = matrix
    .map((cells, index) => ({ line: index + 1, cells }))
    .filter((row) => row.cells.some((cell) => cell !== ""));
  const header = filled[0];
  if (!header) {
    throw new ImportParserError("Файл пустой.");
  }
  const headers = uniqueHeaders(header.cells);
  const rows = filled.slice(1).map((row) => ({
    line: row.line,
    cells: headers.map((_, index) => row.cells[index] ?? ""),
    numeric: headers.map(() => false),
  }));
  assertShape(headers, rows.length);
  return { headers, rows, delimiter, sheetCount: 1 };
}

function decodeUtf8(bytes: Uint8Array): string {
  try {
    return new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  } catch {
    throw new ImportParserError("CSV нужно сохранить в кодировке UTF-8.");
  }
}

function cellText(cell: ExcelJS.Cell): { text: string; numeric: boolean } {
  const value = cell.value;
  if (value == null) {
    return { text: "", numeric: false };
  }
  if (typeof value === "number") {
    return { text: cell.text.trim(), numeric: true };
  }
  if (typeof value === "boolean") {
    return { text: value ? "true" : "false", numeric: false };
  }
  if (value instanceof Date) {
    return { text: cell.text.trim(), numeric: false };
  }
  if (typeof value === "object") {
    if ("richText" in value && Array.isArray(value.richText)) {
      return {
        text: value.richText
          .map((part) => part.text)
          .join("")
          .trim(),
        numeric: false,
      };
    }
    if ("result" in value) {
      if (typeof value.result === "number") {
        return { text: cell.text.trim(), numeric: true };
      }
      if (typeof value.result === "string") {
        return { text: value.result.trim(), numeric: false };
      }
      return { text: "", numeric: false };
    }
    if ("text" in value && typeof value.text === "string") {
      const hyperlink = "hyperlink" in value ? ` ${String(value.hyperlink)}` : "";
      return { text: `${value.text}${hyperlink}`.trim(), numeric: false };
    }
  }
  return { text: cell.text.trim(), numeric: false };
}

async function parseXlsx(bytes: Uint8Array): Promise<ParsedTable> {
  if (bytes.length < 2 || bytes[0] !== 0x50 || bytes[1] !== 0x4b) {
    throw new ImportParserError("Файл XLSX повреждён или это не книга Excel.");
  }
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(Buffer.from(bytes) as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet) {
    throw new ImportParserError("В книге Excel нет листов.");
  }
  if (sheet.rowCount > MAX_IMPORT_ROWS + 1) {
    throw new ImportParserError(
      `В файле больше ${MAX_IMPORT_ROWS} строк. Разделите прайс на части.`,
    );
  }
  const width = Math.min(sheet.columnCount, MAX_IMPORT_COLUMNS + 1);
  const headerRow = sheet.getRow(1);
  const headerCells = Array.from({ length: width }, (_, index) =>
    cellText(headerRow.getCell(index + 1)),
  );
  if (headerCells.length > MAX_IMPORT_COLUMNS && headerCells[MAX_IMPORT_COLUMNS]?.text) {
    throw new ImportParserError(`В файле больше ${MAX_IMPORT_COLUMNS} колонок.`);
  }
  const used = headerCells.findLastIndex((cell) => cell.text !== "");
  if (used < 0) {
    throw new ImportParserError("В файле нет строки с названиями колонок.");
  }
  const headers = uniqueHeaders(headerCells.slice(0, used + 1).map((cell) => cell.text));
  const rows: ParsedRow[] = [];
  for (let line = 2; line <= sheet.rowCount; line += 1) {
    const excelRow = sheet.getRow(line);
    const read = headers.map((_, index) => cellText(excelRow.getCell(index + 1)));
    if (read.every((cell) => cell.text === "")) {
      continue;
    }
    rows.push({
      line,
      cells: read.map((cell) => cell.text),
      numeric: read.map((cell) => cell.numeric),
    });
  }
  assertShape(headers, rows.length);
  return { headers, rows, delimiter: "xlsx", sheetCount: workbook.worksheets.length };
}

function extensionOf(filename: string): string {
  const match = filename.toLowerCase().match(/(\.[a-z0-9]+)$/);
  return match?.[1] ?? "";
}

export const ImportParser = {
  async parse(input: {
    filename: string;
    bytes: Uint8Array;
    delimiter?: ImportDelimiter;
  }): Promise<ParsedTable> {
    if (input.bytes.byteLength === 0) {
      throw new ImportParserError("Файл пустой.");
    }
    if (input.bytes.byteLength > MAX_IMPORT_BYTES) {
      throw new ImportParserError("Файл больше 5 МБ. Разделите прайс на части.");
    }
    const extension = extensionOf(input.filename);
    if (extension === ".xls") {
      throw new ImportParserError(
        "Формат XLS не принимается. Сохраните прайс как XLSX или CSV UTF-8.",
      );
    }
    if (extension === ".xlsx") {
      return parseXlsx(input.bytes);
    }
    if (extension !== ".csv") {
      throw new ImportParserError("Нужен файл CSV, XLSX. Формат XLS не принимается.");
    }
    if (input.bytes[0] === 0x50 && input.bytes[1] === 0x4b) {
      throw new ImportParserError("Файл похож на Excel, но загружен как CSV.");
    }
    const text = decodeUtf8(input.bytes);
    const delimiter =
      input.delimiter === "comma"
        ? ","
        : input.delimiter === "semicolon"
          ? ";"
          : sniffDelimiter(text);
    const kind = delimiter === ";" ? "semicolon" : "comma";
    return tableFromMatrix(parseCsvText(text, delimiter), kind);
  },
};
