import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { handleAdminLogin } from "@/app/api/admin/login/route";
import { handleSupplierCreate } from "@/app/api/admin/suppliers/route";
import { handleSupplierProbe } from "@/app/api/admin/suppliers/[id]/probe/route";
import { getPrismaClient } from "@/lib/db/prisma";
import { handlePublishedProduct } from "@/modules/catalog/http";
import { getPublishedProduct } from "@/modules/catalog/repository";
import { ImportService } from "@/modules/imports/service";
import { resetCatalogTables } from "@/test/database";

const previousPassword = process.env.ADMIN_PASSWORD;

beforeEach(async () => {
  process.env.ADMIN_PASSWORD = "stage3-admin-password";
  await resetCatalogTables();
});

afterEach(() => {
  if (previousPassword === undefined) {
    delete process.env.ADMIN_PASSWORD;
  } else {
    process.env.ADMIN_PASSWORD = previousPassword;
  }
});

function csv(price: string): Uint8Array {
  return new TextEncoder().encode(
    `Artikul;OEM;Brand;Name;Price;Quantity\n00012345;1K0698151A;Bosch;Колодки;${price};2\n`,
  );
}

describe("supplier import", () => {
  it("previews before writing and keeps one card for two suppliers", async () => {
    const prisma = getPrismaClient();
    const first = await prisma.supplier.create({
      data: { name: "Поставщик А", code: "supplier-a" },
    });
    const second = await prisma.supplier.create({
      data: { name: "Поставщик Б", code: "supplier-b" },
    });
    const uploaded = await ImportService.upload({
      filename: "a.csv",
      bytes: csv("12345,67"),
      delimiter: "semicolon",
      sourceType: "SUPPLIER",
      supplierId: first.id,
      warehouseId: null,
      templateId: null,
    });
    expect(await prisma.product.count()).toBe(0);
    const preview = await ImportService.preview(uploaded.id, {
      Artikul: "article",
      OEM: "oem",
      Brand: "partBrand",
      Name: "name",
      Price: "purchasePrice",
      Quantity: "quantity",
    });
    expect(preview.create).toBe(1);
    expect(await prisma.product.count()).toBe(0);

    await ImportService.commit(uploaded.id);
    const product = await prisma.product.findFirst({ include: { offers: true } });
    expect(product?.status).toBe("DRAFT");
    expect(product?.article).toBe("00012345");
    expect(product?.offers).toHaveLength(1);
    expect(product?.offers[0]?.purchasePrice?.toFixed(2)).toBe("12345.67");
    expect(product?.offers[0]?.retailPrice).toBeNull();

    await prisma.productOffer.update({
      where: { id: product!.offers[0]!.id },
      data: { retailPrice: "50.00" },
    });
    const secondJob = await ImportService.upload({
      filename: "b.csv",
      bytes: csv("10,00"),
      delimiter: "semicolon",
      sourceType: "SUPPLIER",
      supplierId: second.id,
      warehouseId: null,
      templateId: null,
    });
    const secondPreview = await ImportService.preview(secondJob.id, {
      Artikul: "article",
      OEM: "oem",
      Brand: "partBrand",
      Name: "name",
      Price: "purchasePrice",
      Quantity: "quantity",
    });
    expect(secondPreview.update).toBe(1);
    await ImportService.commit(secondJob.id);

    const offers = await prisma.productOffer.findMany({ include: { supplier: true } });
    expect(await prisma.product.count()).toBe(1);
    expect(offers).toHaveLength(2);
    const original = offers.find((offer) => offer.supplierId === first.id);
    expect(original?.retailPrice?.toFixed(2)).toBe("50.00");
    expect(original?.purchasePrice?.toFixed(2)).toBe("12345.67");

    expect(await getPublishedProduct(product!.slug)).toBeNull();
    await prisma.product.update({
      where: { id: product!.id },
      data: { status: "PUBLISHED" },
    });
    const published = await getPublishedProduct(product!.slug);
    const response = await handlePublishedProduct(product!.slug);
    const body = await response.text();
    expect(published?.price).toEqual({ amount: "50.00", currency: "BYN" });
    expect(body).not.toContain("12345.67");
    expect(body).not.toContain("Поставщик");
    expect(body).not.toContain("999.01");

    await ImportService.rollback(secondJob.id);
    expect(await prisma.productOffer.count()).toBe(1);
    await ImportService.rollback(uploaded.id);
    expect(await prisma.product.count()).toBe(0);
    await expect(ImportService.rollback(uploaded.id)).rejects.toThrow(/Откатить/);
  });

  it("rejects an admin request without a session and does not fake an API probe", async () => {
    const denied = await handleSupplierCreate(
      new Request("http://127.0.0.1:3000/api/admin/suppliers", { method: "POST" }),
    );
    expect(denied.status).toBe(401);

    const signed = await handleAdminLogin(
      new Request("http://127.0.0.1:3000/api/admin/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ password: "stage3-admin-password" }),
      }),
    );
    expect(signed.status).toBe(200);
    const cookie = signed.headers.get("set-cookie") ?? "";
    const prisma = getPrismaClient();
    const supplier = await prisma.supplier.create({
      data: {
        name: "API",
        code: "api-supplier",
        apiEnabled: true,
        credentialsEnvKey: "SUPPLIER_API_TOKEN",
      },
    });
    const probe = await handleSupplierProbe(
      new Request(`http://127.0.0.1:3000/api/admin/suppliers/${supplier.id}/probe`, {
        method: "POST",
        headers: {
          cookie: cookie.split(";")[0] ?? "",
          "content-type": "application/json",
        },
        body: "{}",
      }),
      supplier.id,
    );
    const payload = await probe.json();
    expect(probe.status).toBe(501);
    expect(JSON.stringify(payload)).not.toContain('"ok":true');
    expect(payload.message).toMatch(/не подключена/);
  });
});
