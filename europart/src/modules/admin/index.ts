import type { AppModule } from "@/modules/types";

export const adminModule = {
  id: "admin",
  stage: 5,
  summary:
    "Админ-ready API поставщиков, складов, офферов и импорта (токен). Полный UI панели — позже.",
} satisfies AppModule;

export { requireAdminApi, configuredAdminToken } from "@/modules/admin/guard";
export { writeAudit, listAudit } from "@/modules/admin/audit";
