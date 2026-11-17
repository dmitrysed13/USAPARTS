import Link from "next/link";
import { adminNav } from "@/modules/admin/nav";
import { logoutAdminAction } from "@/modules/admin/logout";
import { adminRoleLabels, roleHasPermission, type AdminRoleId } from "@/modules/admin/roles";
import type { AdminSessionPayload } from "@/modules/admin/session";
import { buttonClassName } from "@/components/ui/button";

export function AdminShell({
  session,
  children,
}: {
  session: AdminSessionPayload;
  children: React.ReactNode;
}) {
  const items = adminNav.filter((item) =>
    roleHasPermission(session.role as AdminRoleId, item.permission),
  );
  return (
    <div className="min-h-screen bg-surface-muted text-ink" data-admin-shell="">
      <header className="border-b border-line bg-surface">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-ink-muted">
              EUROPART Admin
            </p>
            <p className="font-display text-lg font-semibold">
              {session.name} · {adminRoleLabels[session.role]}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link className="text-sm font-medium hover:text-brand" href="/">
              На витрину
            </Link>
            <form action={logoutAdminAction}>
              <button className={buttonClassName("ghost")} type="submit">
                Выйти
              </button>
            </form>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl gap-6 px-4 py-6 lg:grid-cols-[15rem_minmax(0,1fr)] sm:px-6">
        <nav aria-label="Админ-разделы" className="grid h-fit gap-1 rounded-2xl border border-line bg-surface p-3">
          {items.map((item) => (
            <Link
              className="rounded-lg px-3 py-2 text-sm font-medium hover:bg-surface-muted hover:text-brand"
              href={item.href}
              key={item.href}
            >
              {item.label}
              {item.stub ? (
                <span className="ml-1 text-xs text-ink-muted">(позже)</span>
              ) : null}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
