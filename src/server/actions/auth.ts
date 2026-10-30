"use server";

import { hash } from "bcryptjs";
import { AuthError } from "next-auth";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { signIn, signOut } from "@/auth";
import { prisma } from "@/lib/db";
import { rateLimit } from "@/lib/rate-limit";
import { clientIp } from "@/lib/security";
import { registerSchema } from "@/lib/validators";
import { safeNext } from "@/server/guard";

export async function loginAction(formData: FormData) {
  const email = String(formData.get("email") ?? "").toLowerCase();
  const password = String(formData.get("password") ?? "");
  const next = safeNext(String(formData.get("next") ?? ""));
  const limit = await rateLimit(`login:${clientIp(await headers())}`, 10, 600);
  if (!limit.ok) redirect("/login?error=rate");
  try {
    await signIn("credentials", { email, password, redirectTo: next });
  } catch (error) {
    if (error instanceof AuthError) redirect(`/login?error=credentials&next=${encodeURIComponent(next)}`);
    throw error;
  }
}

export async function logoutAction() {
  await signOut({ redirectTo: "/" });
}

export async function registerAction(formData: FormData) {
  const parsed = registerSchema.safeParse({
    name: formData.get("name"),
    email: formData.get("email"),
    phone: formData.get("phone"),
    password: formData.get("password"),
  });
  if (!parsed.success) redirect("/register?error=fields");
  const limit = await rateLimit(`register:${clientIp(await headers())}`, 5, 3600);
  if (!limit.ok) redirect("/register?error=rate");
  const email = parsed.data.email.toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) redirect("/register?error=exists");
  const passwordHash = await hash(parsed.data.password, 10);
  await prisma.user.create({
    data: {
      email,
      name: parsed.data.name,
      phone: parsed.data.phone || null,
      passwordHash,
      role: "CUSTOMER",
    },
  });
  await signIn("credentials", { email, password: parsed.data.password, redirectTo: "/account" });
}
