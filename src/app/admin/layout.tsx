import Link from "next/link";
import { ROLE_LABEL } from "@/lib/labels";
import { ADMIN_LINKS, can } from "@/lib/rbac";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const session = await requirePermission("dashboard.view");
  const links = ADMIN_LINKS.filter((link) => can(session.user.role, link.permission));
  return (
    <div className="min-h-screen bg-mist md:grid md:grid-cols-[240px_1fr]">
      <aside className="bg-navy p-4 text-white">
        <Link href="/" className="text-sm text-white/70">На витрину</Link>
        <p className="mt-3 text-lg font-semibold">USAPARTS</p>
        <p className="text-xs text-white/70">{session.user.name} · {ROLE_LABEL[session.user.role]}</p>
        <nav className="mt-4 grid gap-1 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="rounded px-2 py-1.5 hover:bg-white/10">
              {link.label}
            </Link>
          ))}
        </nav>
      </aside>
      <div className="p-4 md:p-8">{children}</div>
    </div>
  );
}
