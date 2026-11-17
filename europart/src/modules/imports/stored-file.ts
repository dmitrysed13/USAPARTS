import { ImportFlowError } from "@/modules/imports/errors";
import type { ParsedRow, ParsedTable } from "@/modules/imports/parser";
import { readSummary } from "@/modules/imports/report";

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isBooleanArray(value: unknown): value is boolean[] {
  return Array.isArray(value) && value.every((item) => typeof item === "boolean");
}

export function readStoredTable(
  headers: unknown,
  rawRows: unknown,
  summary: unknown,
): ParsedTable {
  if (!isStringArray(headers) || headers.length === 0) {
    throw new ImportFlowError("Сохранённый файл импорта повреждён.");
  }
  if (!rawRows || typeof rawRows !== "object" || Array.isArray(rawRows)) {
    throw new ImportFlowError("Сохранённый файл импорта повреждён.");
  }
  const rowsValue = (rawRows as { rows?: unknown }).rows;
  if (!Array.isArray(rowsValue)) {
    throw new ImportFlowError("Сохранённый файл импорта повреждён.");
  }
  const rows: ParsedRow[] = rowsValue.map((row) => {
    if (!row || typeof row !== "object") {
      throw new ImportFlowError("Сохранённый файл импорта повреждён.");
    }
    const record = row as { line?: unknown; cells?: unknown; numeric?: unknown };
    if (typeof record.line !== "number" || !isStringArray(record.cells)) {
      throw new ImportFlowError("Сохранённый файл импорта повреждён.");
    }
    const numeric = isBooleanArray(record.numeric)
      ? record.numeric
      : record.cells.map(() => false);
    return { line: record.line, cells: record.cells, numeric };
  });
  const stored = readSummary(summary);
  const delimiter = stored?.delimiter;
  return {
    headers,
    rows,
    delimiter: delimiter === "semicolon" || delimiter === "xlsx" ? delimiter : "comma",
    sheetCount: stored?.sheetCount ?? 1,
  };
}
