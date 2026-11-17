import "server-only";

import { cookies } from "next/headers";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";
import { hashPassword, verifyPassword } from "@/modules/admin/password";
import type { AdminPermission } from "@/modules/admin/roles";
import { roleHasPermission, type AdminRoleId } from "@/modules/admin/roles";
import {
  ADMIN_SESSION_COOKIE,
  adminSessionCookieOptions,
  decodeAdminSession,
  encodeAdminSession,
  resolveAdminSessionSecret,
  type AdminSessionPayload,
} from "@/modules/admin/session";

export class AdminAuthError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "AdminAuthError";
  }
}

export async function readAdminSession(): Promise<AdminSessionPayload | null> {
  const secret = resolveAdminSessionSecret();
  if (!secret) {
    return null;
  }
  const jar = await cookies();
  return decodeAdminSession(jar.get(ADMIN_SESSION_COOKIE)?.value, secret);
}

export async function requireAdminSession(
  permission?: AdminPermission,
): Promise<AdminSessionPayload> {
  const session = await readAdminSession();
  if (!session) {
    throw new AdminAuthError("Требуется вход в админку.");
  }
  if (permission && !roleHasPermission(session.role, permission)) {
    throw new AdminAuthError("Недостаточно прав для этого раздела.");
  }
  return session;
}

export async function writeAdminSession(session: Omit<AdminSessionPayload, "exp">) {
  const secret = resolveAdminSessionSecret();
  if (!secret) {
    throw new AdminAuthError(
      "Сессия админки не настроена. Задайте ADMIN_SESSION_SECRET или ADMIN_API_TOKEN.",
    );
  }
  const jar = await cookies();
  jar.set(
    ADMIN_SESSION_COOKIE,
    encodeAdminSession(session, secret),
    adminSessionCookieOptions(),
  );
}

export async function clearAdminSession() {
  const jar = await cookies();
  jar.delete(ADMIN_SESSION_COOKIE);
}

async function ensureBootstrapSuperAdmin() {
  const email = process.env.ADMIN_BOOTSTRAP_EMAIL?.trim().toLowerCase();
  const password = process.env.ADMIN_BOOTSTRAP_PASSWORD?.trim();
  if (!email || !password || password.length < 12) {
    return null;
  }
  return withDatabase(async () => {
    const prisma = getPrismaClient();
    const count = await prisma.staffUser.count();
    if (count > 0) {
      return prisma.staffUser.findFirst({
        where: { email, isActive: true },
      });
    }
    return prisma.staffUser.create({
      data: {
        email,
        name: "Super Admin",
        role: "SUPER_ADMIN",
        passwordHash: hashPassword(password),
      },
    });
  });
}

export async function loginStaff(emailRaw: string, password: string) {
  const email = emailRaw.trim().toLowerCase();
  if (!email || password.length < 8) {
    throw new AdminAuthError("Укажите email и пароль.");
  }
  await ensureBootstrapSuperAdmin();
  const user = await withDatabase(() =>
    getPrismaClient().staffUser.findFirst({
      where: { email, isActive: true },
    }),
  );
  if (!user || !verifyPassword(password, user.passwordHash)) {
    throw new AdminAuthError("Неверный email или пароль.");
  }
  await writeAdminSession({
    userId: user.id,
    email: user.email,
    name: user.name,
    role: user.role as AdminRoleId,
  });
  return user;
}

export async function createStaffUser(input: {
  email: string;
  name: string;
  role: AdminRoleId;
  password: string;
}) {
  const email = input.email.trim().toLowerCase();
  if (!email || input.password.length < 12) {
    throw new AdminAuthError("Email и пароль от 12 символов обязательны.");
  }
  return withDatabase(() =>
    getPrismaClient().staffUser.create({
      data: {
        email,
        name: input.name.trim().slice(0, 120) || email,
        role: input.role,
        passwordHash: hashPassword(input.password),
      },
    }),
  );
}
