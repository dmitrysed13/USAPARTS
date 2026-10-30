import type { Prisma, ProductCondition, StockStatus } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildSearchText, normalizeOem } from "@/lib/normalize";
import { dollarsToCents } from "@/lib/money";
import { slugify } from "@/lib/slug";
import { CONDITIONS, STOCK_STATUSES } from "@/lib/labels";

export type FitmentInput = { makeSlug: string; modelSlug?: string; year?: number; engineCode?: string; note?: string };

export type ProductInput = {
  id?: string;
  sku: string;
  name: string;
  slug?: string;
  description: string;
  manufacturer?: string;
  warranty?: string;
  originCountry?: string;
  condition: string;
  stockStatus: string;
  currency?: string;
  price?: string;
  quantity: number;
  deliveryMinDays?: number | null;
  deliveryMaxDays?: number | null;
  donorStockNumber?: string;
  donorVin?: string;
  allowBackorder: boolean;
  isPublished: boolean;
  isDemo: boolean;
  isFeatured: boolean;
  indexable: boolean;
  categoryId?: string;
  categorySlug?: string;
  seoTitle?: string;
  seoDescription?: string;
  canonicalPath?: string;
  oems: string[];
  specs: { name: string; value: string }[];
  fitments: FitmentInput[];
  canEditPrice: boolean;
};

function asCondition(value: string): ProductCondition {
  if (!CONDITIONS.includes(value)) throw new Error("Некорректное состояние.");
  return value as ProductCondition;
}

function asStock(value: string): StockStatus {
  if (!STOCK_STATUSES.includes(value)) throw new Error("Некорректный статус наличия.");
  return value as StockStatus;
}

async function resolveFitment(row: FitmentInput) {
  const make = await prisma.vehicleMake.findUnique({ where: { slug: row.makeSlug } });
  if (!make) throw new Error(`Марка «${row.makeSlug}» не найдена.`);
  const model = row.modelSlug
    ? await prisma.vehicleModel.findUnique({ where: { makeId_slug: { makeId: make.id, slug: row.modelSlug } } })
    : null;
  if (row.modelSlug && !model) throw new Error(`Модель «${row.modelSlug}» не найдена.`);
  let generationId: string | undefined;
  let engineId: string | undefined;
  if (model && row.year) {
    const yearRow = await prisma.vehicleYear.findFirst({
      where: { year: row.year, generation: { modelId: model.id } },
      include: { engines: true },
    });
    if (!yearRow) throw new Error(`Год ${row.year} не заведён для ${row.modelSlug}.`);
    generationId = yearRow.generationId;
    if (row.engineCode) {
      const engine = yearRow.engines.find((item) => item.code.toLowerCase() === row.engineCode!.toLowerCase());
      if (!engine) throw new Error(`Двигатель «${row.engineCode}» не найден для ${row.year}.`);
      engineId = engine.id;
    }
  }
  return {
    makeId: make.id,
    modelId: model?.id,
    generationId,
    year: row.year,
    engineId,
    note: row.note,
  };
}

export async function saveProduct(input: ProductInput, actorId?: string) {
  const condition = asCondition(input.condition);
  const stockStatus = asStock(input.stockStatus);
  const sku = input.sku.trim();
  const name = input.name.trim();
  if (!sku || !name) throw new Error("Укажите артикул и название.");
  const slug = slugify(input.slug || name);
  if (!slug) throw new Error("Не удалось построить URL.");
  const category = input.categoryId
    ? await prisma.category.findUnique({ where: { id: input.categoryId } })
    : await prisma.category.findUnique({ where: { slug: input.categorySlug ?? "" } });
  if (!category) throw new Error("Категория не найдена.");
  const existing = input.id ? await prisma.product.findUnique({ where: { id: input.id } }) : null;
  let priceCents = existing?.priceCents ?? null;
  if (input.canEditPrice) priceCents = dollarsToCents(input.price ?? "");
  const quantity = Number.isInteger(input.quantity) && input.quantity >= 0 && input.quantity <= 100000 ? input.quantity : 0;
  const fitments = [];
  for (const fitment of input.fitments) {
    if (!fitment.makeSlug) continue;
    fitments.push(await resolveFitment(fitment));
  }
  const oems = [...new Set(input.oems.map((oem) => oem.trim()).filter(Boolean))];
  const data: Prisma.ProductUncheckedCreateInput = {
    sku,
    name,
    slug,
    description: input.description.trim() || "Описание не заполнено.",
    manufacturer: input.manufacturer?.trim() || null,
    warranty: input.warranty?.trim() || null,
    originCountry: input.originCountry?.trim() || null,
    condition,
    stockStatus,
    priceCents,
    currency: (input.currency || "USD").toUpperCase().slice(0, 3),
    quantity,
    deliveryMinDays: input.deliveryMinDays ?? null,
    deliveryMaxDays: input.deliveryMaxDays ?? null,
    donorStockNumber: input.donorStockNumber?.trim() || null,
    donorVin: input.donorVin?.trim() || null,
    allowBackorder: input.allowBackorder,
    isPublished: input.isPublished,
    isDemo: input.isDemo,
    isFeatured: input.isFeatured,
    indexable: input.indexable && input.isPublished,
    seoTitle: input.seoTitle?.trim() || null,
    seoDescription: input.seoDescription?.trim() || null,
    canonicalPath: input.canonicalPath?.trim() || null,
    categoryId: category.id,
    searchText: buildSearchText([
      name,
      sku,
      input.manufacturer,
      category.name,
      ...oems,
      ...fitments.map((fit) => fit.note),
      ...input.fitments.flatMap((fit) => [fit.makeSlug, fit.modelSlug, fit.year ? String(fit.year) : "", fit.engineCode]),
    ]),
  };
  const product = existing
    ? await prisma.product.update({ where: { id: existing.id }, data })
    : await prisma.product.create({ data });
  await prisma.oemNumber.deleteMany({ where: { productId: product.id } });
  if (oems.length) {
    await prisma.oemNumber.createMany({
      data: oems.map((number, index) => ({
        productId: product.id,
        number,
        normalized: normalizeOem(number),
        isPrimary: index === 0,
      })),
    });
  }
  await prisma.productSpec.deleteMany({ where: { productId: product.id } });
  if (input.specs.length) {
    await prisma.productSpec.createMany({
      data: input.specs.filter((spec) => spec.name && spec.value).map((spec, index) => ({
        productId: product.id,
        name: spec.name.slice(0, 80),
        value: spec.value.slice(0, 200),
        sortOrder: index,
      })),
    });
  }
  await prisma.productCompatibility.deleteMany({ where: { productId: product.id } });
  if (fitments.length) {
    await prisma.productCompatibility.createMany({
      data: fitments.map((fit) => ({ productId: product.id, ...fit })),
    });
  }
  const warehouse = stockStatus === "US_WAREHOUSE" ? "US" : stockStatus === "IN_TRANSIT" ? "TRANSIT" : "LOCAL";
  await prisma.inventory.deleteMany({ where: { productId: product.id } });
  await prisma.inventory.create({ data: { productId: product.id, warehouse, quantity } });
  if (!input.isPublished) {
    await prisma.slugTombstone.upsert({
      where: { path: `/product/${product.slug}` },
      update: { httpStatus: 410, note: "Снято с публикации" },
      create: { path: `/product/${product.slug}`, httpStatus: 410, note: "Снято с публикации" },
    });
  } else {
    await prisma.slugTombstone.deleteMany({ where: { path: `/product/${product.slug}` } });
  }
  await prisma.auditLog.create({
    data: { actorId, action: existing ? "update" : "create", entity: "Product", entityId: product.id, payload: { sku } },
  });
  return product;
}

export function parseSpecs(raw: string) {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [name, ...rest] = line.split("|");
      return { name: (name ?? "").trim(), value: rest.join("|").trim() };
    })
    .filter((spec) => spec.name && spec.value);
}

export function parseFitments(formData: FormData): FitmentInput[] {
  const rows: FitmentInput[] = [];
  for (let i = 0; i < 3; i++) {
    const makeSlug = String(formData.get(`make_${i}`) ?? "").trim();
    if (!makeSlug) continue;
    const yearRaw = String(formData.get(`year_${i}`) ?? "").trim();
    const year = yearRaw ? Number(yearRaw) : undefined;
    rows.push({
      makeSlug,
      modelSlug: String(formData.get(`model_${i}`) ?? "").trim() || undefined,
      year: year && Number.isInteger(year) ? year : undefined,
      engineCode: String(formData.get(`engine_${i}`) ?? "").trim() || undefined,
    });
  }
  return rows;
}
