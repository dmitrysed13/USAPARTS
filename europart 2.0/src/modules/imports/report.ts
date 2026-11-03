export type ImportSummary = {
  total: number;
  create: number;
  update: number;
  error: number;
  duplicate: number;
  applied: number;
  delimiter: string | null;
  sheetCount: number;
};

export function summarizeLines(
  lines: Array<{ action: string }>,
  applied = 0,
  delimiter: string | null = null,
  sheetCount = 1,
): ImportSummary {
  const summary: ImportSummary = {
    total: lines.length,
    create: 0,
    update: 0,
    error: 0,
    duplicate: 0,
    applied,
    delimiter,
    sheetCount,
  };
  for (const line of lines) {
    if (line.action === "CREATE") {
      summary.create += 1;
    } else if (line.action === "UPDATE") {
      summary.update += 1;
    } else if (line.action === "ERROR") {
      summary.error += 1;
    } else if (line.action === "DUPLICATE") {
      summary.duplicate += 1;
    }
  }
  return summary;
}

export function readSummary(value: unknown): ImportSummary | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    return null;
  }
  const record = value as Record<string, unknown>;
  const numberOr = (key: string) => (typeof record[key] === "number" ? record[key] : 0);
  return {
    total: numberOr("total"),
    create: numberOr("create"),
    update: numberOr("update"),
    error: numberOr("error"),
    duplicate: numberOr("duplicate"),
    applied: numberOr("applied"),
    delimiter: typeof record.delimiter === "string" ? record.delimiter : null,
    sheetCount: typeof record.sheetCount === "number" ? record.sheetCount : 1,
  };
}

export const ImportReportService = {
  summarize: summarizeLines,
  read: readSummary,
};
