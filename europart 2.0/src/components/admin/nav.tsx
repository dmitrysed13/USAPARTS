import Link from "next/link";
import { Container } from "@/components/ui/container";

const links = [
  { href: "/admin", label: "Сводка" },
  { href: "/admin/suppliers", label: "Поставщики" },
  { href: "/admin/warehouses", label: "Склады" },
  { href: "/admin/categories", label: "Категории" },
  { href: "/admin/brands", label: "Бренды" },
  { href: "/admin/products", label: "Товары" },
  { href: "/admin/imports/new", label: "Импорт" },
  { href: "/admin/audit", label: "Журнал" },
];

export function AdminNav() {
  return (
    <div className="border-b border-line bg-panel text-panel-foreground">
      <Container className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3">
        <Link className="font-display text-sm font-semibold" href="/admin">
          EUROPART
        </Link>
        <nav aria-label="Админ-панель" className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
          {links.map((link) => (
            <Link className="hover:text-white" href={link.href} key={link.href}>
              {link.label}
            </Link>
          ))}
        </nav>
        <form action="/api/admin/logout" className="ml-auto" method="post">
          <button
            className="text-sm text-panel-foreground/80 hover:text-white"
            type="submit"
          >
            Выйти
          </button>
        </form>
      </Container>
    </div>
  );
}
