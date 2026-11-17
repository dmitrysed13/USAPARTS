export const ADMIN_ROLES = [
  "SUPER_ADMIN",
  "ADMIN",
  "MANAGER",
  "WAREHOUSE_MANAGER",
  "SEO_MANAGER",
  "B2B_MANAGER",
] as const;

export type AdminRoleId = (typeof ADMIN_ROLES)[number];

export const adminRoleLabels: Record<AdminRoleId, string> = {
  SUPER_ADMIN: "Super Admin",
  ADMIN: "Admin",
  MANAGER: "Manager",
  WAREHOUSE_MANAGER: "Warehouse Manager",
  SEO_MANAGER: "SEO Manager",
  B2B_MANAGER: "B2B Manager",
};

/** Admin UI sections / API permission keys. */
export const ADMIN_PERMISSIONS = [
  "dashboard",
  "products",
  "categories",
  "vehicles",
  "oem",
  "analogs",
  "suppliers",
  "warehouses",
  "stock",
  "prices",
  "orders",
  "payments",
  "vin",
  "customers",
  "b2b",
  "import",
  "integrations",
  "seo",
  "articles",
  "redirects",
  "company",
  "staff",
] as const;

export type AdminPermission = (typeof ADMIN_PERMISSIONS)[number];

const all = [...ADMIN_PERMISSIONS];

const rolePermissions: Record<AdminRoleId, readonly AdminPermission[]> = {
  SUPER_ADMIN: all,
  ADMIN: all.filter((item) => item !== "staff"),
  MANAGER: [
    "dashboard",
    "products",
    "categories",
    "vehicles",
    "oem",
    "analogs",
    "prices",
    "orders",
    "payments",
    "vin",
    "customers",
    "b2b",
  ],
  WAREHOUSE_MANAGER: [
    "dashboard",
    "products",
    "suppliers",
    "warehouses",
    "stock",
    "prices",
    "import",
  ],
  SEO_MANAGER: ["dashboard", "seo", "articles", "redirects"],
  B2B_MANAGER: ["dashboard", "customers", "b2b", "orders"],
};

export function roleHasPermission(role: AdminRoleId, permission: AdminPermission): boolean {
  return rolePermissions[role]?.includes(permission) ?? false;
}

export function isAdminRole(value: string): value is AdminRoleId {
  return (ADMIN_ROLES as readonly string[]).includes(value);
}
