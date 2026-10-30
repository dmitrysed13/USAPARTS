"use server";

import { redirect } from "next/navigation";
import { readCart, writeCart } from "@/lib/cart";
import { prisma } from "@/lib/db";

export async function addToCart(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const product = await prisma.product.findFirst({
    where: { id: productId, isPublished: true },
    select: { id: true, priceCents: true, stockStatus: true, quantity: true, allowBackorder: true },
  });
  if (!product || product.priceCents == null) redirect("/cart?error=price");
  const blocked = product.stockStatus === "OUT_OF_STOCK" && !product.allowBackorder;
  if (blocked) redirect("/cart?error=stock");
  const qty = Number.isInteger(quantity) && quantity >= 1 && quantity <= 99 ? quantity : 1;
  const lines = await readCart();
  const existing = lines.find((line) => line.productId === product.id);
  if (existing) existing.quantity = Math.min(99, existing.quantity + qty);
  else lines.push({ productId: product.id, quantity: qty });
  await writeCart(lines);
  redirect("/cart");
}

export async function updateCart(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  const quantity = Number(formData.get("quantity") ?? 1);
  const lines = await readCart();
  const next = lines
    .map((line) => (line.productId === productId ? { ...line, quantity } : line))
    .filter((line) => line.quantity > 0 && line.quantity <= 99);
  await writeCart(next);
  redirect("/cart");
}

export async function removeFromCart(formData: FormData) {
  const productId = String(formData.get("productId") ?? "");
  await writeCart((await readCart()).filter((line) => line.productId !== productId));
  redirect("/cart");
}
