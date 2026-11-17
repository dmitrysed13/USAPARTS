import ExcelJS from "exceljs";
import { describe, expect, it } from "vitest";
import { buildImportPreview } from "@/modules/imports/preview";
import { parseMoney } from "@/modules/imports/money";
import { ImportParser } from "@/modules/imports/parser";
import type { MatchCandidate } from "@/modules/imports/matcher";

const bosch: MatchCandidate = {
  id: "product-bosch",
  name: "Колодки",
  articleNormalized: "00012345",
  brandKey: "BOSCH",
  oems: ["1K0698151A"],
};

describe("price import pipeline", () => {
  it("keeps a textual article and semicolon CSV", async () => {
    const bytes = new TextEncoder().encode(
      "\uFEFFАртикул;Название;Цена\n00012345;Колодки;12,50\n",
    );
    const table = await ImportParser.parse({
      filename: "price.csv",
      bytes,
      delimiter: "semicolon",
    });
    expect(table.rows[0]?.cells[0]).toBe("00012345");
    expect(table.delimiter).toBe("semicolon");
  });

  it("rejects legacy xls", async () => {
    await expect(
      ImportParser.parse({ filename: "price.xls", bytes: new Uint8Array([1, 2, 3]) }),
    ).rejects.toThrow(/XLS/);
  });

  it("reads an xlsx text article and warns when Excel stored a number", async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Прайс");
    sheet.getCell("A1").value = "Artikul";
    sheet.getCell("B1").value = "Name";
    sheet.getCell("A2").value = "00012345";
    sheet.getCell("A2").numFmt = "@";
    sheet.getCell("B2").value = "Колодки";
    sheet.getCell("A3").value = 12345;
    sheet.getCell("B3").value = "Фильтр";
    const bytes = new Uint8Array(await workbook.xlsx.writeBuffer());
    const table = await ImportParser.parse({ filename: "price.xlsx", bytes });
    expect(table.rows[0]?.cells[0]).toBe("00012345");
    expect(table.rows[0]?.numeric[0]).toBe(false);
    expect(table.rows[1]?.numeric[0]).toBe(true);
    const preview = buildImportPreview(table, { Artikul: "article", Name: "name" }, []);
    expect(preview.lines[1]?.message).toMatch(/как число/);
  });

  it("parses both decimal styles", () => {
    expect(parseMoney("1 234,50")).toEqual({ ok: true, value: "1234.50" });
    expect(parseMoney("1.234,56")).toEqual({ ok: true, value: "1234.56" });
    expect(parseMoney("1,234.56")).toEqual({ ok: true, value: "1234.56" });
    expect(parseMoney("12.50")).toEqual({ ok: true, value: "12.50" });
    expect(parseMoney("-1").ok).toBe(false);
    expect(parseMoney("12,3456").ok).toBe(false);
  });

  it("does not merge products by name or by a different brand", () => {
    const table = {
      headers: ["Artikul", "Brand", "Name"],
      delimiter: "comma" as const,
      sheetCount: 1,
      rows: [
        { line: 2, cells: ["NEW-1", "Bosch", "Колодки"], numeric: [false, false, false] },
        {
          line: 3,
          cells: ["00012345", "TRW", "Колодки"],
          numeric: [false, false, false],
        },
      ],
    };
    const preview = buildImportPreview(
      table,
      { Artikul: "article", Brand: "partBrand", Name: "name" },
      [bosch],
    );
    expect(preview.lines.map((line) => line.action)).toEqual(["CREATE", "CREATE"]);
  });

  it("marks an article without a brand as duplicate when several cards match", () => {
    const table = {
      headers: ["Artikul", "Name"],
      delimiter: "comma" as const,
      sheetCount: 1,
      rows: [{ line: 2, cells: ["00012345", "Колодки"], numeric: [false, false] }],
    };
    const second = { ...bosch, id: "other", brandKey: "TRW" };
    const preview = buildImportPreview(table, { Artikul: "article", Name: "name" }, [
      bosch,
      second,
    ]);
    expect(preview.lines[0]?.action).toBe("DUPLICATE");
  });

  it("marks both copies of one OEM inside the file", () => {
    const table = {
      headers: ["OEM", "Name"],
      delimiter: "comma" as const,
      sheetCount: 1,
      rows: [
        { line: 2, cells: ["1K0 698 151 A", "Колодки"], numeric: [false, false] },
        { line: 3, cells: ["1K0698151A", "Другое имя"], numeric: [false, false] },
      ],
    };
    const preview = buildImportPreview(table, { OEM: "oem", Name: "name" }, []);
    expect(preview.lines.every((line) => line.action === "DUPLICATE")).toBe(true);
  });
});
