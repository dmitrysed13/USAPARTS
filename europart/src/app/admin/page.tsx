import { connection } from "next/server";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getAdminDashboardCounts } from "@/modules/admin/dashboard";

export default async function AdminDashboardPage() {
  await connection();
  await requireAdminSession("dashboard");
  const counts = await getAdminDashboardCounts();
  const cards = [
    { href: "/admin/analytics", label: "Analytics KPI", value: "→" },
    { href: "/admin/products", label: "Товары", value: `${counts.publishedProducts}/${counts.products}` },
    { href: "/admin/categories", label: "Категории", value: String(counts.categories) },
    { href: "/admin/vehicles/makes", label: "Марки", value: String(counts.brands) },
    { href: "/admin/orders", label: "Заказы", value: String(counts.orders) },
    { href: "/admin/vin-leads", label: "VIN (новые)", value: String(counts.vinRequests) },
    { href: "/admin/suppliers", label: "Поставщики", value: String(counts.suppliers) },
    { href: "/admin/warehouses", label: "Склады", value: String(counts.warehouses) },
    { href: "/admin/stock", label: "Активные офферы", value: String(counts.offers) },
    { href: "/admin/import", label: "Импорты", value: String(counts.imports) },
    { href: "/admin/customers", label: "Лиды", value: String(counts.leads) },
  ];
  return (
    <div>
      <AdminPageHeader
        description="Сводка по реальным данным из базы. Пустые значения — норма, пока ассортимент не загружен. Детальные KPI — в Analytics."
        title="Dashboard"
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map((card) => (
          <li key={card.href}>
            <Link
              className="block rounded-2xl border border-line bg-surface p-4 hover:border-brand"
              href={card.href}
            >
              <p className="text-sm text-ink-muted">{card.label}</p>
              <p className="mt-2 font-display text-3xl font-semibold">{card.value}</p>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
