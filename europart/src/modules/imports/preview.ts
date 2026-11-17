import type { ColumnMapping } from "@/modules/imports/fields";
import { DuplicateDetector } from "@/modules/imports/duplicates";
import { ProductMatcher, type MatchCandidate } from "@/modules/imports/matcher";
import { ImportNormalizer, type NormalizedRow } from "@/modules/imports/normalizer";
import type { ParsedTable } from "@/modules/imports/parser";
import { summarizeLines, type ImportSummary } from "@/modules/imports/report";

export type PreviewLine = {
  rowNumber: number;
  normalized: NormalizedRow;
  action: "CREATE" | "UPDATE" | "ERROR" | "DUPLICATE";
  message: string | null;
  productId: string | null;
};

function joinMessage(parts: Array<string | null | undefined>): string | null {
  const unique = [...new Set(parts.filter((part): part is string => Boolean(part)))];
  return unique.length > 0 ? unique.join(" ") : null;
}

export const ImportValidator = {
  classify(
    row: NormalizedRow,
    candidates: MatchCandidate[],
  ): Omit<PreviewLine, "rowNumber"> {
    if (!row.articleNormalized && !row.oemNormalized) {
      row.errors.push("Нужен артикул или OEM. Похожее название товар не объединяет.");
    }
    if (row.errors.length > 0) {
      return {
        normalized: row,
        action: "ERROR",
        message: joinMessage([...row.errors, ...row.warnings]),
        productId: null,
      };
    }
    const decision = ProductMatcher.match(row, candidates);
    if (decision.action === "CREATE" && !row.name) {
      return {
        normalized: row,
        action: "ERROR",
        message: joinMessage(["Для нового товара нужно название.", ...row.warnings]),
        productId: null,
      };
    }
    const note =
      decision.action === "UPDATE"
        ? "Существующая карточка не переименовывается. Меняется предложение."
        : decision.message;
    return {
      normalized: row,
      action: decision.action,
      message: joinMessage([note, ...row.warnings]),
      productId: decision.productId,
    };
  },
};

export function buildImportPreview(
  table: ParsedTable,
  mapping: ColumnMapping,
  candidates: MatchCandidate[],
): { lines: PreviewLine[]; summary: ImportSummary } {
  const classified = table.rows.map((row) => {
    const normalized = ImportNormalizer.normalize({
      row,
      headers: table.headers,
      mapping,
    });
    return {
      rowNumber: row.line,
      ...ImportValidator.classify(normalized, candidates),
    };
  });
  const lines = DuplicateDetector.mark(classified);
  return {
    lines,
    summary: summarizeLines(lines, 0, table.delimiter),
  };
}
