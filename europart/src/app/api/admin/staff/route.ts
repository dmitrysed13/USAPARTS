import { connection } from "next/server";
import { createStaffUser } from "@/modules/admin/auth";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { isAdminRole } from "@/modules/admin/roles";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";

export async function GET(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "staff");
  if (!gate.ok) {
    return gate.response;
  }
  const staff = await withDatabase(() =>
    getPrismaClient().staffUser.findMany({
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        isActive: true,
        createdAt: true,
      },
    }),
  );
  return adminJson({ staff });
}

export async function POST(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "staff");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const role = String(body.role ?? "");
    if (!isAdminRole(role)) {
      throw new Error("Неизвестная роль.");
    }
    const user = await createStaffUser({
      email: String(body.email ?? ""),
      name: String(body.name ?? ""),
      role,
      password: String(body.password ?? ""),
    });
    return adminJson(
      {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
      },
      201,
    );
  } catch (error) {
    return fail(
      request,
      "/api/admin/staff",
      publicError(error, "Сотрудник не создан."),
      400,
    );
  }
}
