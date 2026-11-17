import type { Metadata } from "next";
import { connection } from "next/server";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { AdminShell } from "@/components/admin/admin-shell";
import { closedRobots } from "@/lib/seo/closed";
import { readAdminSession } from "@/modules/admin/auth";

export const metadata: Metadata = {
  title: {
    default: "Админка",
    template: "%s — EUROPART Admin",
  },
  robots: closedRobots,
};

/** Auth + DB sections are request-time; allow blocking navigations into admin. */
export const instant = false;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  await connection();
  const pathname = (await headers()).get("x-pathname") ?? "";
  const isLogin = pathname === "/admin/login" || pathname.startsWith("/admin/login?");
  if (isLogin) {
    return (
      <div className="min-h-screen bg-surface-muted" data-admin-shell="">
        {children}
      </div>
    );
  }

  const session = await readAdminSession();
  if (!session) {
    redirect("/admin/login");
  }

  return <AdminShell session={session}>{children}</AdminShell>;
}
