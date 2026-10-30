"use server";

import { parse } from "csv-parse/sync";
import ExcelJS from "exceljs";
import { requirePermission } from "@/server/guard";
import { saveProduct, type ProductInput } from "@/server/product-admin";
import { revalidateStore } from "@/server/revalidate-store";

export type ImportState = { created: number; updated: number; errors: string[] } | null;

function cell(value: unknown) {
  if (value == null) return "";
  if (typeof value === "object" && value && "text" in value) return String((value as { text: string }).text);
  return String(value);
}

export async function importCatalogAction(_prev: ImportState, formData: FormData): Promise<ImportState> {
  const session = await requirePermission("import.run");
  const file = formData.get("file");
  if (!(file instanceof File) || file.size === 0) return { created: 0, updated: 0, errors: ["Файл не выбран."] };
  if (file.size > 5_000_000) return { created: 0, updated: 0, errors: ["Файл больше 5 МБ."] };
  const buffer = Buffer.from(await file.arrayBuffer());
  let rows: Record<string, string>[] = [];
  try {
    if (file.name.toLowerCase().endsWith(".xlsx")) {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
      const sheet = workbook.worksheets[0];
      if (!sheet) return { created: 0, updated: 0, errors: ["В книге нет листов."] };
      const headers = (sheet.getRow(1).values as unknown[]).slice(1).map((value) => cell(value).trim());
      sheet.eachRow((row, index) => {
        if (index === 1) return;
        const record: Record<string, string> = {};
        headers.forEach((header, headerIndex) => {
          if (!header) return;
          record[header] = cell(row.getCell(headerIndex + 1).value).trim();
        });
        rows.push(record);
      });
    } else {
      rows = parse(buffer, { columns: true, skip_empty_lines: true, bom: true, relax_column_count: true }) as Record<string, string>[];
    }
  } catch {
    return { created: 0, updated: 0, errors: ["Не удалось прочитать файл. Нужен CSV или XLSX с заголовками."] };
  }
  let created = 0;
  let updated = 0;
  const errors: string[] = [];
  for (const [index, row] of rows.entries()) {
    try {
      const sku = row.sku?.trim();
      if (!sku) throw new Error("пустой sku");
      const existing = await (await import("@/lib/db")).prisma.product.findUnique({ where: { sku }, select: { id: true } });
      const input: ProductInput = {
        id: existing?.id,
        sku,
        name: row.name || sku,
        slug: row.slug,
        description: row.description || "Описание будет добавлено.",
        manufacturer: row.manufacturer,
        warranty: row.warranty,
        originCountry: row.originCountry,
        condition: row.condition || "NEW",
        stockStatus: row.stockStatus || "ON_ORDER",
        currency: row.currency || "USD",
        price: row.price,
        quantity: Number(row.quantity || 0),
        allowBackorder: row.allowBackorder === "true",
        isPublished: row.isPublished !== "false",
        isDemo: row.isDemo === "true",
        isFeatured: false,
        indexable: row.isPublished !== "false",
        categorySlug: row.categorySlug,
        oems: row.oem ? row.oem.split("|") : [],
        specs: [],
        fitments: row.makeSlug ? [{ makeSlug: row.makeSlug, modelSlug: row.modelSlug, year: row.year ? Number(row.year) : undefined }] : [],
        canEditPrice: true,
      };
      await saveProduct(input, session.user.id);
      if (existing) updated += 1;
      else created += 1;
    } catch (error) {
      errors.push(`Строка ${index + 2}: ${error instanceof Error ? error.message : "ошибка"}`);
    }
  }
  await revalidateStore();
  return { created, updated, errors: errors.slice(0, 30) };
}
