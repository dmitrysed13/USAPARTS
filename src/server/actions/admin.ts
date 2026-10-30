"use server";

import { hash } from "bcryptjs";
import { redirect } from "next/navigation";
import { mkdir, writeFile, unlink } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/db";
import { can } from "@/lib/rbac";
import { slugify } from "@/lib/slug";
import { detectImage, safeStoragePath } from "@/lib/security";
import { parseFitments, parseSpecs, saveProduct } from "@/server/product-admin";
import { requirePermission } from "@/server/guard";
import { revalidateStore } from "@/server/revalidate-store";
import { dollarsToCents } from "@/lib/money";

function flag(formData: FormData, name: string) {
  return formData.get(name) === "on" || formData.get(name) === "true";
}

function num(value: FormDataEntryValue | null) {
  const raw = String(value ?? "").trim();
  if (!raw) return null;
  const parsed = Number(raw);
  return Number.isInteger(parsed) ? parsed : null;
}

export async function saveProductAction(formData: FormData) {
  const session = await requirePermission("products.write");
  const id = String(formData.get("id") ?? "") || undefined;
  try {
    const product = await saveProduct(
      {
        id,
        sku: String(formData.get("sku") ?? ""),
        name: String(formData.get("name") ?? ""),
        slug: String(formData.get("slug") ?? ""),
        description: String(formData.get("description") ?? ""),
        manufacturer: String(formData.get("manufacturer") ?? ""),
        warranty: String(formData.get("warranty") ?? ""),
        originCountry: String(formData.get("originCountry") ?? ""),
        condition: String(formData.get("condition") ?? ""),
        stockStatus: String(formData.get("stockStatus") ?? ""),
        currency: String(formData.get("currency") ?? "USD"),
        price: String(formData.get("price") ?? ""),
        quantity: num(formData.get("quantity")) ?? 0,
        deliveryMinDays: num(formData.get("deliveryMinDays")),
        deliveryMaxDays: num(formData.get("deliveryMaxDays")),
        donorStockNumber: String(formData.get("donorStockNumber") ?? ""),
        donorVin: String(formData.get("donorVin") ?? ""),
        allowBackorder: flag(formData, "allowBackorder"),
        isPublished: flag(formData, "isPublished"),
        isDemo: flag(formData, "isDemo"),
        isFeatured: flag(formData, "isFeatured"),
        indexable: flag(formData, "indexable"),
        categoryId: String(formData.get("categoryId") ?? ""),
        seoTitle: String(formData.get("seoTitle") ?? ""),
        seoDescription: String(formData.get("seoDescription") ?? ""),
        canonicalPath: String(formData.get("canonicalPath") ?? ""),
        oems: String(formData.get("oems") ?? "").split(/[\n,]/),
        specs: parseSpecs(String(formData.get("specs") ?? "")),
        fitments: parseFitments(formData),
        canEditPrice: can(session.user.role, "products.price"),
      },
      session.user.id,
    );
    await revalidateStore([`/product/${product.slug}`]);
    redirect(`/admin/products/${product.id}?saved=1`);
  } catch (error) {
    if (typeof error === "object" && error && "digest" in error && String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")) {
      throw error;
    }
    const message = error instanceof Error ? error.message : "Не удалось сохранить товар.";
    redirect(`/admin/products/${id ?? "new"}?error=${encodeURIComponent(message.slice(0, 180))}`);
  }
}

export async function uploadProductImageAction(formData: FormData) {
  const session = await requirePermission("photos.manage");
  const productId = String(formData.get("productId") ?? "");
  const file = formData.get("file");
  const alt = String(formData.get("alt") ?? "").trim();
  if (!(file instanceof File) || file.size === 0) redirect(`/admin/products/${productId}?error=file`);
  const bytes = new Uint8Array(await file.arrayBuffer());
  const mime = detectImage(bytes, file.type);
  if (!mime) redirect(`/admin/products/${productId}?error=${encodeURIComponent("Нужен JPEG, PNG или WebP до 5 МБ.")}`);
  const sharp = (await import("sharp")).default;
  const image = sharp(bytes);
  const meta = await image.metadata();
  const webp = await image.webp({ quality: 82 }).toBuffer();
  const key = `uploads/products/${crypto.randomUUID()}.webp`;
  const full = safeStoragePath(key);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, webp);
  await prisma.productImage.create({
    data: {
      productId,
      storageKey: key,
      alt: alt || "Фото товара",
      width: meta.width ?? 800,
      height: meta.height ?? 600,
      mimeType: "image/webp",
    },
  });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "upload", entity: "ProductImage", entityId: productId },
  });
  await revalidateStore();
  redirect(`/admin/products/${productId}?saved=1`);
}

export async function deleteProductImageAction(formData: FormData) {
  await requirePermission("photos.manage");
  const id = String(formData.get("id") ?? "");
  const image = await prisma.productImage.findUnique({ where: { id } });
  if (!image) redirect("/admin/photos");
  await prisma.productImage.delete({ where: { id } });
  try {
    await unlink(safeStoragePath(image.storageKey));
  } catch {
    /* file may already be gone */
  }
  await revalidateStore();
  redirect(`/admin/products/${image.productId}?saved=1`);
}

export async function saveCategoryAction(formData: FormData) {
  const session = await requirePermission("catalog.write");
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const parentId = String(formData.get("parentId") ?? "") || null;
  if (!name || !slug) redirect("/admin/categories?error=fields");
  await prisma.category.upsert({
    where: { slug },
    update: {
      name,
      parentId,
      intro: String(formData.get("intro") ?? "") || null,
      seoTitle: String(formData.get("seoTitle") ?? "") || null,
      seoDescription: String(formData.get("seoDescription") ?? "") || null,
    },
    create: {
      name,
      slug,
      parentId,
      intro: String(formData.get("intro") ?? "") || null,
      seoTitle: String(formData.get("seoTitle") ?? "") || null,
      seoDescription: String(formData.get("seoDescription") ?? "") || null,
    },
  });
  await prisma.auditLog.create({ data: { actorId: session.user.id, action: "save", entity: "Category", entityId: slug } });
  await revalidateStore();
  redirect("/admin/categories?saved=1");
}

export async function saveMakeAction(formData: FormData) {
  const session = await requirePermission("catalog.write");
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  if (!name || !slug) redirect("/admin/makes?error=fields");
  await prisma.vehicleMake.upsert({
    where: { slug },
    update: {
      name,
      country: String(formData.get("country") ?? "USA"),
      intro: String(formData.get("intro") ?? "") || null,
      seoTitle: String(formData.get("seoTitle") ?? "") || null,
      seoDescription: String(formData.get("seoDescription") ?? "") || null,
      isFeatured: flag(formData, "isFeatured"),
      isActive: String(formData.get("isActive") ?? "true") !== "false",
    },
    create: {
      name,
      slug,
      country: String(formData.get("country") ?? "USA"),
      intro: String(formData.get("intro") ?? "") || null,
      isFeatured: flag(formData, "isFeatured"),
      isActive: String(formData.get("isActive") ?? "true") !== "false",
    },
  });
  await prisma.auditLog.create({ data: { actorId: session.user.id, action: "save", entity: "VehicleMake", entityId: slug } });
  await revalidateStore();
  redirect("/admin/makes?saved=1");
}

export async function saveModelAction(formData: FormData) {
  const session = await requirePermission("catalog.write");
  const makeId = String(formData.get("makeId") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? name));
  const year = num(formData.get("year"));
  const engineName = String(formData.get("engineName") ?? "").trim();
  const engineCode = String(formData.get("engineCode") ?? "").trim();
  if (!makeId || !name || !slug) redirect("/admin/models?error=fields");
  const model = await prisma.vehicleModel.upsert({
    where: { makeId_slug: { makeId, slug } },
    update: { name, intro: String(formData.get("intro") ?? "") || null },
    create: { makeId, name, slug, intro: String(formData.get("intro") ?? "") || null },
  });
  if (year && engineName && engineCode) {
    const generation = await prisma.vehicleGeneration.upsert({
      where: { modelId_slug: { modelId: model.id, slug: `gen-${year}` } },
      update: { name: String(year), yearFrom: year, yearTo: year },
      create: { modelId: model.id, name: String(year), slug: `gen-${year}`, yearFrom: year, yearTo: year },
    });
    const vehicleYear = await prisma.vehicleYear.upsert({
      where: { generationId_year: { generationId: generation.id, year } },
      update: {},
      create: { generationId: generation.id, year },
    });
    await prisma.engine.upsert({
      where: { yearId_code: { yearId: vehicleYear.id, code: engineCode } },
      update: { name: engineName },
      create: { yearId: vehicleYear.id, name: engineName, code: engineCode },
    });
  }
  await prisma.auditLog.create({ data: { actorId: session.user.id, action: "save", entity: "VehicleModel", entityId: model.id } });
  await revalidateStore();
  redirect("/admin/models?saved=1");
}

export async function updateOrderStatusAction(formData: FormData) {
  const session = await requirePermission("orders.manage");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "");
  await prisma.order.update({ where: { id }, data: { status: status as never } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "status", entity: "Order", entityId: id, payload: { status } },
  });
  redirect(`/admin/orders/${id}?saved=1`);
}

export async function updateVinStatusAction(formData: FormData) {
  const session = await requirePermission("vin.manage");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "NEW");
  await prisma.vinRequest.update({ where: { id }, data: { status: status as never } });
  await prisma.auditLog.create({ data: { actorId: session.user.id, action: "status", entity: "VinRequest", entityId: id } });
  redirect("/admin/vin-requests?saved=1");
}

export async function updateInquiryStatusAction(formData: FormData) {
  await requirePermission("inquiries.manage");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "NEW");
  await prisma.inquiry.update({ where: { id }, data: { status } });
  redirect("/admin/inquiries?saved=1");
}

export async function updateInventoryAction(formData: FormData) {
  const session = await requirePermission("inventory.manage");
  const productId = String(formData.get("productId") ?? "");
  const quantity = num(formData.get("quantity")) ?? 0;
  const stockStatus = String(formData.get("stockStatus") ?? "IN_STOCK");
  await prisma.product.update({ where: { id: productId }, data: { quantity, stockStatus: stockStatus as never } });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "inventory", entity: "Product", entityId: productId, payload: { quantity, stockStatus } },
  });
  await revalidateStore();
  redirect("/admin/inventory?saved=1");
}

export async function bulkPriceAction(formData: FormData) {
  const session = await requirePermission("products.price");
  if (!flag(formData, "confirm")) redirect("/admin/prices?error=confirm");
  const mode = String(formData.get("mode") ?? "percent");
  const amount = Number(String(formData.get("amount") ?? "").replace(",", "."));
  const categorySlug = String(formData.get("categorySlug") ?? "");
  if (!Number.isFinite(amount)) redirect("/admin/prices?error=amount");
  const products = await prisma.product.findMany({
    where: {
      priceCents: { not: null },
      ...(categorySlug ? { OR: [{ category: { slug: categorySlug } }, { category: { parent: { slug: categorySlug } } }] } : {}),
    },
    select: { id: true, priceCents: true },
  });
  for (const product of products) {
    const current = product.priceCents ?? 0;
    const next = mode === "set" ? Math.round(amount * 100) : Math.max(0, Math.round(current * (1 + amount / 100)));
    await prisma.product.update({ where: { id: product.id }, data: { priceCents: next } });
  }
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "bulk-price", entity: "Product", payload: { mode, amount, count: products.length, categorySlug } },
  });
  await revalidateStore();
  redirect(`/admin/prices?saved=${products.length}`);
}

export async function bulkStockAction(formData: FormData) {
  const session = await requirePermission("inventory.manage");
  if (!flag(formData, "confirm")) redirect("/admin/inventory?error=confirm");
  const categorySlug = String(formData.get("categorySlug") ?? "");
  const stockStatus = String(formData.get("stockStatus") ?? "");
  const quantity = num(formData.get("quantity"));
  const result = await prisma.product.updateMany({
    where: categorySlug
      ? { OR: [{ category: { slug: categorySlug } }, { category: { parent: { slug: categorySlug } } }] }
      : {},
    data: {
      ...(stockStatus ? { stockStatus: stockStatus as never } : {}),
      ...(quantity != null ? { quantity } : {}),
    },
  });
  await prisma.auditLog.create({
    data: { actorId: session.user.id, action: "bulk-stock", entity: "Product", payload: { count: result.count, stockStatus, quantity } },
  });
  await revalidateStore();
  redirect(`/admin/inventory?saved=${result.count}`);
}

export async function moderateReviewAction(formData: FormData) {
  await requirePermission("reviews.moderate");
  const id = String(formData.get("id") ?? "");
  const status = String(formData.get("status") ?? "PENDING");
  await prisma.review.update({ where: { id }, data: { status: status as never } });
  await revalidateStore();
  redirect("/admin/reviews?saved=1");
}

export async function saveTemplateAction(formData: FormData) {
  await requirePermission("seo.write");
  const key = String(formData.get("key") ?? "").trim();
  if (!key) redirect("/admin/seo?error=fields");
  await prisma.seoTemplate.upsert({
    where: { key },
    update: {
      titleTemplate: String(formData.get("titleTemplate") ?? ""),
      descriptionTemplate: String(formData.get("descriptionTemplate") ?? ""),
    },
    create: {
      key,
      titleTemplate: String(formData.get("titleTemplate") ?? ""),
      descriptionTemplate: String(formData.get("descriptionTemplate") ?? ""),
    },
  });
  await revalidateStore();
  redirect("/admin/seo?saved=1");
}

export async function saveLandingAction(formData: FormData) {
  await requirePermission("seo.write");
  const slug = slugify(String(formData.get("slug") ?? ""));
  const h1 = String(formData.get("h1") ?? "").trim();
  if (!slug || !h1) redirect("/admin/seo?error=fields");
  await prisma.landingPage.upsert({
    where: { slug },
    update: {
      h1,
      body: String(formData.get("body") ?? ""),
      seoTitle: String(formData.get("seoTitle") ?? h1),
      seoDescription: String(formData.get("seoDescription") ?? ""),
      indexable: flag(formData, "indexable"),
      isPublished: flag(formData, "isPublished"),
    },
    create: {
      slug,
      h1,
      body: String(formData.get("body") ?? ""),
      seoTitle: String(formData.get("seoTitle") ?? h1),
      seoDescription: String(formData.get("seoDescription") ?? ""),
      indexable: flag(formData, "indexable"),
      isPublished: flag(formData, "isPublished"),
    },
  });
  await revalidateStore([`/${slug}`]);
  redirect("/admin/seo?saved=1");
}

export async function savePageAction(formData: FormData) {
  await requirePermission("pages.write");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? title));
  const body = String(formData.get("body") ?? "");
  const page = id
    ? await prisma.page.update({
        where: { id },
        data: { title, slug, body, seoTitle: String(formData.get("seoTitle") ?? "") || null, seoDescription: String(formData.get("seoDescription") ?? "") || null, isPublished: flag(formData, "isPublished") },
      })
    : await prisma.page.create({
        data: { title, slug, body, seoTitle: String(formData.get("seoTitle") ?? "") || null, seoDescription: String(formData.get("seoDescription") ?? "") || null, isPublished: flag(formData, "isPublished") },
      });
  await revalidateStore([`/info/${page.slug}`]);
  redirect(`/admin/pages/${page.id}?saved=1`);
}

export async function saveArticleAction(formData: FormData) {
  await requirePermission("articles.write");
  const id = String(formData.get("id") ?? "");
  const title = String(formData.get("title") ?? "").trim();
  const slug = slugify(String(formData.get("slug") ?? title));
  const published = flag(formData, "isPublished");
  const data = {
    title,
    slug,
    excerpt: String(formData.get("excerpt") ?? ""),
    body: String(formData.get("body") ?? ""),
    seoTitle: String(formData.get("seoTitle") ?? "") || null,
    seoDescription: String(formData.get("seoDescription") ?? "") || null,
    isPublished: published,
    publishedAt: published ? new Date() : null,
    categoryId: String(formData.get("categoryId") ?? "") || null,
  };
  const article = id ? await prisma.article.update({ where: { id }, data }) : await prisma.article.create({ data });
  await revalidateStore([`/blog/${article.slug}`]);
  redirect(`/admin/articles/${article.id}?saved=1`);
}

export async function saveUserAction(formData: FormData) {
  const session = await requirePermission("users.manage");
  const email = String(formData.get("email") ?? "").trim().toLowerCase();
  const name = String(formData.get("name") ?? "").trim();
  const role = String(formData.get("role") ?? "MANAGER");
  const password = String(formData.get("password") ?? "");
  const id = String(formData.get("id") ?? "");
  if (!email || !name || !["ADMIN", "MANAGER", "CONTENT", "CUSTOMER"].includes(role)) redirect("/admin/users?error=fields");
  if (id && id === session.user.id && role !== "ADMIN") redirect("/admin/users?error=self");
  if (id) {
    await prisma.user.update({
      where: { id },
      data: { email, name, role: role as never, ...(password ? { passwordHash: await hash(password, 10) } : {}) },
    });
  } else {
    if (password.length < 8) redirect("/admin/users?error=password");
    await prisma.user.create({ data: { email, name, role: role as never, passwordHash: await hash(password, 10) } });
  }
  redirect("/admin/users?saved=1");
}

export async function setPriceAction(formData: FormData) {
  await requirePermission("products.price");
  const id = String(formData.get("id") ?? "");
  const priceCents = dollarsToCents(String(formData.get("price") ?? ""));
  await prisma.product.update({ where: { id }, data: { priceCents } });
  await revalidateStore();
  redirect("/admin/prices?saved=1");
}
