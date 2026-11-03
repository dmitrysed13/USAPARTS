import { beforeEach, describe, expect, it } from "vitest";
import { handleCatalogSearch, handlePublishedProduct } from "@/modules/catalog/http";
import { handleVinRequest } from "@/modules/vin/http";
import { getPrismaClient } from "@/lib/db/prisma";
import { resetRateLimitsForTests } from "@/lib/security/rate-limit";
import {
  getCategoryPageContext,
  getPublishedProduct,
  listCategoryTree,
  searchPublishedProducts,
} from "@/modules/catalog/repository";
import { getVehicleModel } from "@/modules/fitment/repository";
import { normalizeArticle } from "@/modules/search/normalize-article";
import { resetCatalogTables } from "@/test/database";

const secretRetail = "50.00";
const secretPurchase = "12345.67";
const secretB2b = "999.01";

beforeEach(async () => {
  resetRateLimitsForTests();
  await resetCatalogTables();
});

async function createCategoryTree() {
  const prisma = getPrismaClient();
  const parent = await prisma.category.create({
    data: {
      name: "Тормозная система",
      slug: "tormoznaya-sistema",
      description: "Тормоза",
    },
  });
  const child = await prisma.category.create({
    data: { name: "Колодки", slug: "kolodki", parentId: parent.id },
  });
  return { parent, child };
}

describe("catalog database", () => {
  it("creates a category and nests a child", async () => {
    const { parent } = await createCategoryTree();
    const tree = await listCategoryTree();
    expect(tree).toHaveLength(1);
    expect(tree[0]?.id).toBe(parent.id);
    expect(tree[0]?.children.map((item) => item.slug)).toEqual(["kolodki"]);
    const page = await getCategoryPageContext("tormoznaya-sistema");
    expect(page?.categoryIds.sort()).toEqual([parent.id, page?.children[0]?.id].sort());
  });

  it("creates a brand, a model and a modification", async () => {
    const prisma = getPrismaClient();
    const brand = await prisma.vehicleBrand.create({
      data: { name: "Volkswagen", slug: "volkswagen" },
    });
    const model = await prisma.vehicleModel.create({
      data: {
        brandId: brand.id,
        name: "Golf",
        slug: "golf",
        generation: "VII",
        startYear: 2012,
        endYear: 2019,
      },
    });
    await prisma.vehicleModification.create({
      data: { modelId: model.id, name: "1.4 TSI", engineCode: "CZCA" },
    });
    const loaded = await getVehicleModel("volkswagen", "golf");
    expect(loaded?.brand.name).toBe("Volkswagen");
    expect(loaded?.generation).toBe("VII");
    expect(loaded?.modifications[0]?.engineCode).toBe("CZCA");
    expect(loaded?.modifications[0]?.fuelType).toBeNull();
  });

  it("stores several identifiers and a verified modification link", async () => {
    const prisma = getPrismaClient();
    const { child } = await createCategoryTree();
    const partBrand = await prisma.partBrand.create({
      data: { name: "Fixture Brand", slug: "fixture-brand" },
    });
    const vehicle = await prisma.vehicleBrand.create({
      data: { name: "Volkswagen", slug: "volkswagen" },
    });
    const model = await prisma.vehicleModel.create({
      data: { brandId: vehicle.id, name: "Golf", slug: "golf" },
    });
    const modification = await prisma.vehicleModification.create({
      data: { modelId: model.id, name: "1.4 TSI" },
    });
    const product = await prisma.product.create({
      data: {
        name: "Колодки передние",
        slug: "kolodki-perednie",
        categoryId: child.id,
        partBrandId: partBrand.id,
        article: "GDB-1",
        articleNormalized: normalizeArticle("GDB-1"),
        condition: "NEW",
        productType: "ANALOG",
        status: "PUBLISHED",
        identifiers: {
          create: [
            {
              value: "1K0 615 301 AA",
              normalizedValue: normalizeArticle("1K0 615 301 AA"),
              type: "OEM",
              isPrimary: true,
            },
            {
              value: "GDB-1",
              normalizedValue: normalizeArticle("GDB-1"),
              type: "ARTICLE",
              isPrimary: true,
            },
            {
              value: "CROSS-1",
              normalizedValue: normalizeArticle("CROSS-1"),
              type: "CROSS_REFERENCE",
            },
          ],
        },
        compatibilities: {
          create: [
            {
              vehicleModificationId: modification.id,
              compatibilitySource: "MANUAL",
              confidence: "UNVERIFIED",
            },
            {
              vehicleModificationId: (
                await prisma.vehicleModification.create({
                  data: { modelId: model.id, name: "2.0 TDI" },
                })
              ).id,
              compatibilitySource: "MANUAL",
              confidence: "VERIFIED",
              verifiedAt: new Date(),
            },
          ],
        },
      },
    });

    const published = await getPublishedProduct(product.slug);
    expect(published?.identifiers).toHaveLength(3);
    expect(published?.compatibility).toHaveLength(1);
    expect(published?.compatibility[0]?.modificationName).toBe("2.0 TDI");
    expect(published?.availability).toBe("unknown");
    expect(published?.price).toBeNull();
  });
});

describe("catalog search", () => {
  beforeEach(async () => {
    const prisma = getPrismaClient();
    const category = await prisma.category.create({
      data: { name: "Фильтры", slug: "filtry" },
    });
    const partBrand = await prisma.partBrand.create({
      data: { name: "Mann", slug: "mann" },
    });
    await prisma.product.create({
      data: {
        name: "Фильтр точный",
        slug: "filtr-tochnyj",
        categoryId: category.id,
        partBrandId: partBrand.id,
        article: "OC 90",
        articleNormalized: normalizeArticle("OC 90"),
        condition: "NEW",
        productType: "ANALOG",
        status: "PUBLISHED",
        identifiers: {
          create: [
            {
              value: "1K0615301AA",
              normalizedValue: normalizeArticle("1K0615301AA"),
              type: "OEM",
              isPrimary: true,
            },
            {
              value: "CROSS-1",
              normalizedValue: normalizeArticle("CROSS-1"),
              type: "CROSS_REFERENCE",
            },
          ],
        },
      },
    });
    await prisma.product.create({
      data: {
        name: "Фильтр соседний",
        slug: "filtr-sosednij",
        categoryId: category.id,
        article: "1K0615301AA-EXTRA",
        articleNormalized: normalizeArticle("1K0615301AA-EXTRA"),
        condition: "NEW",
        productType: "ANALOG",
        status: "PUBLISHED",
      },
    });
    await prisma.product.create({
      data: {
        name: "Альфа фильтр",
        slug: "alfa-filtr",
        categoryId: category.id,
        condition: "USED",
        productType: "ORIGINAL",
        status: "PUBLISHED",
      },
    });
    await prisma.product.create({
      data: {
        name: "Бета фильтр",
        slug: "beta-filtr",
        categoryId: category.id,
        condition: "NEW",
        productType: "ANALOG",
        status: "PUBLISHED",
      },
    });
    await prisma.product.create({
      data: {
        name: "Черновик фильтра",
        slug: "chernovik-filtra",
        categoryId: category.id,
        articleNormalized: normalizeArticle("OC 90"),
        condition: "NEW",
        productType: "ANALOG",
        status: "DRAFT",
      },
    });
  });

  it("ranks an exact OEM above a partial article", async () => {
    const page = await searchPublishedProducts({
      q: "1K0615301AA",
      page: 1,
      pageSize: 1,
    });
    expect(page.items[0]?.slug).toBe("filtr-tochnyj");
    expect(page.total).toBeGreaterThan(1);
  });

  it("matches an article, a cross number, case and spaces", async () => {
    expect(
      (await searchPublishedProducts({ q: "oc90", page: 1, pageSize: 12 })).items[0]
        ?.slug,
    ).toBe("filtr-tochnyj");
    expect(
      (await searchPublishedProducts({ q: "OC 90", page: 1, pageSize: 12 })).items[0]
        ?.slug,
    ).toBe("filtr-tochnyj");
    expect(
      (await searchPublishedProducts({ q: "cross 1", page: 1, pageSize: 12 })).items[0]
        ?.slug,
    ).toBe("filtr-tochnyj");
  });

  it("returns an empty page when nothing matches", async () => {
    const page = await searchPublishedProducts({
      q: "zzzz-not-a-part",
      page: 1,
      pageSize: 12,
    });
    expect(page.items).toEqual([]);
    expect(page.total).toBe(0);
  });

  it("paginates name matches", async () => {
    const first = await searchPublishedProducts({ q: "фильтр", page: 1, pageSize: 1 });
    const second = await searchPublishedProducts({ q: "фильтр", page: 2, pageSize: 1 });
    expect(first.items).toHaveLength(1);
    expect(second.items).toHaveLength(1);
    expect(first.items[0]?.slug).not.toBe(second.items[0]?.slug);
    expect(first.total).toBeGreaterThanOrEqual(2);
  });
});

describe("public catalog safety", () => {
  it("keeps purchase data out of the product API", async () => {
    const prisma = getPrismaClient();
    const category = await prisma.category.create({
      data: { name: "Колодки", slug: "kolodki" },
    });
    const supplier = await prisma.supplier.create({
      data: { name: "SECRET-SUPPLIER", code: "secret-supplier" },
    });
    await prisma.product.create({
      data: {
        name: "Колодка с ценой",
        slug: "kolodka-s-cenoj",
        categoryId: category.id,
        condition: "NEW",
        productType: "ORIGINAL",
        status: "PUBLISHED",
        offers: {
          create: {
            sourceType: "SUPPLIER",
            supplierId: supplier.id,
            purchasePrice: secretPurchase,
            retailPrice: secretRetail,
            b2bPrice: secretB2b,
            quantity: 7,
            reservedQuantity: 3,
            availabilityStatus: "IN_STOCK",
          },
        },
      },
    });

    const response = await handlePublishedProduct("kolodka-s-cenoj");
    const body = await response.json();
    const serialized = JSON.stringify(body);
    expect(response.status).toBe(200);
    expect(body.product.price).toEqual({ amount: secretRetail, currency: "BYN" });
    expect(serialized).not.toContain(secretPurchase);
    expect(serialized).not.toContain(secretB2b);
    expect(serialized).not.toContain("SECRET-SUPPLIER");
    expect(serialized).not.toContain("secret-supplier");
    expect(serialized).not.toContain("purchasePrice");
    expect(serialized).not.toContain("b2bPrice");
    expect(serialized).not.toContain("supplierId");
    expect(serialized).not.toContain("reservedQuantity");
  });

  it("rejects a short search query", async () => {
    const response = await handleCatalogSearch(
      new Request("http://localhost/api/catalog/search?q=a"),
    );
    expect(response.status).toBe(400);
  });

  it("rate limits repeated search calls", async () => {
    let blocked = 0;
    for (let attempt = 0; attempt < 31; attempt += 1) {
      const response = await handleCatalogSearch(
        new Request("http://localhost/api/catalog/search?q=a", {
          headers: { "x-forwarded-for": "203.0.113.40" },
        }),
      );
      if (response.status === 429) {
        blocked += 1;
      }
    }
    expect(blocked).toBe(1);
  });
});

describe("VIN requests", () => {
  const payload = {
    vin: "WVWZZZ3CZWE123456",
    customerName: "Иван",
    phone: "+375291112233",
    email: "",
    consent: true,
    website: "",
    partName: "Колодки",
  };

  function post(body: unknown, ip = "203.0.113.10") {
    return handleVinRequest(
      new Request("http://localhost/api/vin-requests", {
        method: "POST",
        headers: { "content-type": "application/json", "x-forwarded-for": ip },
        body: JSON.stringify(body),
      }),
    );
  }

  it("stores a valid request as NEW and hides the contact in the response", async () => {
    const response = await post(payload);
    const body = await response.json();
    expect(response.status).toBe(201);
    expect(body.status).toBe("NEW");
    expect(JSON.stringify(body)).not.toContain(payload.phone);
    const saved = await getPrismaClient().vinRequest.findUnique({
      where: { id: body.id },
    });
    expect(saved?.status).toBe("NEW");
    expect(saved?.vin).toBe(payload.vin);
    expect(saved?.vinIsStandard).toBe(true);
    expect(saved?.consentAccepted).toBe(true);
  });

  it("does not store a request without a name or contact", async () => {
    expect((await post({ ...payload, customerName: "" })).status).toBe(400);
    expect((await post({ ...payload, phone: "", email: "" })).status).toBe(400);
    expect((await post({ ...payload, consent: false })).status).toBe(400);
    expect((await post({ ...payload, website: "spam" })).status).toBe(400);
    expect(await getPrismaClient().vinRequest.count()).toBe(0);
  });

  it("rate limits repeated VIN posts", async () => {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const response = await post(payload, "203.0.113.77");
      expect(response.status).toBe(201);
    }
    const blocked = await post(payload, "203.0.113.77");
    expect(blocked.status).toBe(429);
    expect(blocked.headers.get("retry-after")).toBeTruthy();
    expect(await getPrismaClient().vinRequest.count()).toBe(5);
  });
});
