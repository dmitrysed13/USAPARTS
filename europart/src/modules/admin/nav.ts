import type { AdminPermission } from "@/modules/admin/roles";

export type AdminNavItem = {
  href: string;
  label: string;
  permission: AdminPermission;
  stub?: boolean;
};

export const adminNav: AdminNavItem[] = [
  { href: "/admin", label: "Dashboard", permission: "dashboard" },
  { href: "/admin/products", label: "Products", permission: "products" },
  { href: "/admin/categories", label: "Categories", permission: "categories" },
  { href: "/admin/vehicles/makes", label: "Makes", permission: "vehicles" },
  { href: "/admin/vehicles/models", label: "Models", permission: "vehicles" },
  { href: "/admin/vehicles/generations", label: "Generations", permission: "vehicles" },
  {
    href: "/admin/vehicles/modifications",
    label: "Modifications",
    permission: "vehicles",
  },
  { href: "/admin/vehicles/engines", label: "Engines", permission: "vehicles" },
  { href: "/admin/oem", label: "OEM", permission: "oem" },
  { href: "/admin/analogs", label: "Analogs", permission: "analogs" },
  { href: "/admin/suppliers", label: "Suppliers", permission: "suppliers" },
  { href: "/admin/warehouses", label: "Warehouses", permission: "warehouses" },
  { href: "/admin/stock", label: "Stock", permission: "stock" },
  { href: "/admin/prices", label: "Prices", permission: "prices" },
  { href: "/admin/orders", label: "Orders", permission: "orders" },
  { href: "/admin/payments", label: "Payments", permission: "payments" },
  { href: "/admin/vin-leads", label: "VIN leads", permission: "vin" },
  { href: "/admin/customers", label: "Customers", permission: "customers" },
  { href: "/admin/b2b", label: "B2B", permission: "b2b" },
  { href: "/admin/import", label: "Excel import", permission: "import" },
  { href: "/admin/integrations", label: "API integrations", permission: "integrations" },
  { href: "/admin/seo", label: "SEO", permission: "seo" },
  { href: "/admin/articles", label: "Articles", permission: "articles", stub: true },
  { href: "/admin/redirects", label: "Redirects", permission: "redirects" },
  { href: "/admin/company", label: "Company settings", permission: "company" },
  { href: "/admin/staff", label: "Staff", permission: "staff" },
];
