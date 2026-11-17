import type { AppModule } from "@/modules/types";

export const adminModule = {
  id: "admin",
  stage: 7,
  summary:
    "Админ-панель: RBAC, разделы каталога/заказов/VIN/импорта, company settings с publish-gate.",
} satisfies AppModule;

export { requireAdminApi, requireAdminApiAsync, configuredAdminToken } from "@/modules/admin/guard";
export { writeAudit, listAudit } from "@/modules/admin/audit";
export {
  requireAdminSession,
  readAdminSession,
  loginStaff,
  clearAdminSession,
} from "@/modules/admin/auth";
export { roleHasPermission, adminRoleLabels } from "@/modules/admin/roles";
export { adminNav } from "@/modules/admin/nav";
