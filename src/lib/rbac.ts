export type Permission =
  | "dashboard.view"
  | "products.write"
  | "products.price"
  | "products.publish"
  | "catalog.write"
  | "orders.manage"
  | "customers.view"
  | "vin.manage"
  | "inquiries.manage"
  | "inventory.manage"
  | "reviews.moderate"
  | "seo.write"
  | "pages.write"
  | "articles.write"
  | "users.manage"
  | "import.run"
  | "photos.manage";

const ALL: Permission[] = [
  "dashboard.view",
  "products.write",
  "products.price",
  "products.publish",
  "catalog.write",
  "orders.manage",
  "customers.view",
  "vin.manage",
  "inquiries.manage",
  "inventory.manage",
  "reviews.moderate",
  "seo.write",
  "pages.write",
  "articles.write",
  "users.manage",
  "import.run",
  "photos.manage",
];

const MATRIX: Record<string, Permission[]> = {
  ADMIN: ALL,
  MANAGER: [
    "dashboard.view",
    "products.write",
    "products.price",
    "products.publish",
    "orders.manage",
    "customers.view",
    "vin.manage",
    "inquiries.manage",
    "inventory.manage",
    "reviews.moderate",
    "import.run",
    "photos.manage",
  ],
  CONTENT: [
    "dashboard.view",
    "products.write",
    "products.publish",
    "catalog.write",
    "reviews.moderate",
    "seo.write",
    "pages.write",
    "articles.write",
    "photos.manage",
  ],
  CUSTOMER: [],
};

export function can(role: string | undefined, permission: Permission) {
  if (!role) return false;
  return (MATRIX[role] ?? []).includes(permission);
}

export type AdminLink = { href: string; label: string; permission: Permission };

export const ADMIN_LINKS: AdminLink[] = [
  { href: "/admin", label: "Сводка", permission: "dashboard.view" },
  { href: "/admin/products", label: "Товары", permission: "products.write" },
  { href: "/admin/categories", label: "Категории", permission: "catalog.write" },
  { href: "/admin/makes", label: "Марки", permission: "catalog.write" },
  { href: "/admin/models", label: "Модели", permission: "catalog.write" },
  { href: "/admin/orders", label: "Заказы", permission: "orders.manage" },
  { href: "/admin/customers", label: "Клиенты", permission: "customers.view" },
  { href: "/admin/vin-requests", label: "Заявки VIN", permission: "vin.manage" },
  { href: "/admin/inquiries", label: "Обращения", permission: "inquiries.manage" },
  { href: "/admin/inventory", label: "Остатки", permission: "inventory.manage" },
  { href: "/admin/prices", label: "Цены", permission: "products.price" },
  { href: "/admin/photos", label: "Фотографии", permission: "photos.manage" },
  { href: "/admin/reviews", label: "Отзывы", permission: "reviews.moderate" },
  { href: "/admin/seo", label: "SEO", permission: "seo.write" },
  { href: "/admin/pages", label: "Страницы", permission: "pages.write" },
  { href: "/admin/articles", label: "Статьи", permission: "articles.write" },
  { href: "/admin/users", label: "Пользователи", permission: "users.manage" },
  { href: "/admin/import", label: "Импорт и экспорт", permission: "import.run" },
];
