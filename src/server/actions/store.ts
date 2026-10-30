"use server";

import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { readCart, writeCart } from "@/lib/cart";
import { prisma } from "@/lib/db";
import { placeOrder } from "@/lib/orders";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp, detectImage, safeStoragePath } from "@/lib/security";
import { validateVin } from "@/lib/vin";
import { decodeVin } from "@/lib/integrations/vin-decoder";
import { checkoutSchema, inquirySchema, vinRequestSchema } from "@/lib/validators";
import { logError } from "@/lib/logger";
import { revalidateStore } from "@/server/revalidate-store";

function isNextRedirect(error: unknown) {
  return (
    typeof error === "object" &&
    error !== null &&
    "digest" in error &&
    String((error as { digest?: string }).digest).startsWith("NEXT_REDIRECT")
  );
}

async function ip() {
  return clientIp(await headers());
}

export async function submitVinRequest(formData: FormData) {
  const parsed = vinRequestSchema.safeParse({
    vin: formData.get("vin"),
    makeName: formData.get("makeName"),
    modelName: formData.get("modelName"),
    year: formData.get("year"),
    partDescription: formData.get("partDescription"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    company: formData.get("company"),
  });
  if (!parsed.success) redirect("/vin-search?error=fields");
  if (parsed.data.company) redirect("/vin-search?sent=1");
  const limit = await rateLimit(`vin:${await ip()}`, 8, 600);
  if (!limit.ok) redirect("/vin-search?error=rate");
  const vin = validateVin(parsed.data.vin);
  const year = parsed.data.year ? Number(parsed.data.year) : undefined;
  if (parsed.data.year && (!Number.isInteger(year) || year! < 1950 || year! > 2035)) redirect("/vin-search?error=fields");
  let photoKey: string | undefined;
  const file = formData.get("photo");
  if (file instanceof File && file.size > 0) {
    const bytes = new Uint8Array(await file.arrayBuffer());
    const mime = detectImage(bytes, file.type);
    if (!mime) redirect("/vin-search?error=file");
    const ext = mime === "image/png" ? "png" : mime === "image/webp" ? "webp" : "jpg";
    photoKey = `uploads/vin/${crypto.randomUUID()}.${ext}`;
    const full = safeStoragePath(photoKey);
    await mkdir(path.dirname(full), { recursive: true });
    await writeFile(full, bytes);
  }
  const decoder = vin.ok ? await decodeVin(vin.vin) : { status: "not_connected" as const, message: "VIN не прошёл проверку формата, декодер не вызывался." };
  try {
    await prisma.vinRequest.create({
      data: {
        vin: vin.vin || parsed.data.vin.toUpperCase().slice(0, 17),
        vinValid: vin.ok,
        makeName: parsed.data.makeName || null,
        modelName: parsed.data.modelName || null,
        year,
        partDescription: parsed.data.partDescription,
        phone: parsed.data.phone,
        email: parsed.data.email.toLowerCase(),
        photoKey,
        decoderStatus: decoder.status,
        decoderPayload: decoder.status === "ok" ? (decoder.raw as object) : undefined,
      },
    });
  } catch (error) {
    logError("vin.create", error);
    redirect("/vin-search?error=save");
  }
  redirect("/vin-search?sent=1");
}

export async function submitInquiry(formData: FormData) {
  const parsed = inquirySchema.safeParse({
    type: formData.get("type"),
    productId: formData.get("productId"),
    name: formData.get("name"),
    phone: formData.get("phone"),
    email: formData.get("email"),
    message: formData.get("message"),
    company: formData.get("company"),
  });
  const back = String(formData.get("back") ?? "/");
  const target = back.startsWith("/") && !back.startsWith("//") ? back : "/";
  if (!parsed.success) redirect(`${target}?error=fields`);
  if (parsed.data.company) redirect(`${target}?sent=1`);
  const limit = await rateLimit(`inquiry:${await ip()}`, 10, 600);
  if (!limit.ok) redirect(`${target}?error=rate`);
  await prisma.inquiry.create({
    data: {
      type: parsed.data.type,
      productId: parsed.data.productId || null,
      name: parsed.data.name,
      phone: parsed.data.phone,
      email: parsed.data.email || null,
      message: parsed.data.message,
    },
  });
  redirect(`${target}?sent=1`);
}

export async function submitCheckout(formData: FormData) {
  const parsed = checkoutSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    comment: formData.get("comment"),
    address: formData.get("address"),
    deliveryMethodId: formData.get("deliveryMethodId"),
    couponCode: formData.get("couponCode"),
  });
  if (!parsed.success) redirect("/checkout?error=fields");
  const limit = await rateLimit(`checkout:${await ip()}`, 10, 600);
  if (!limit.ok) redirect("/checkout?error=rate");
  const lines = await readCart();
  if (!lines.length) redirect("/cart?error=empty");
  const session = await auth();
  try {
    const { order, slugs } = await placeOrder({
      ...parsed.data,
      userId: session?.user?.id,
      items: lines,
    });
    await writeCart([]);
    await revalidateStore(slugs.map((slug) => `/product/${slug}`));
    redirect(`/checkout/success?token=${order.accessToken}`);
  } catch (error) {
    if (isNextRedirect(error)) throw error;
    const code = error instanceof Error ? error.message : "save";
    const allowed = new Set(["stock", "price", "coupon", "delivery"]);
    redirect(`/checkout?error=${allowed.has(code) ? code : "save"}`);
  }
}
