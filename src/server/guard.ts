import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { can, type Permission } from "@/lib/rbac";

export async function requirePermission(permission: Permission) {
  const session = await auth();
  if (!session?.user) redirect("/login?next=/admin");
  if (!can(session.user.role, permission)) redirect("/admin/forbidden");
  return session;
}

export function safeNext(value: string | null | undefined, fallback = "/account") {
  if (!value || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return fallback;
  return value;
}
