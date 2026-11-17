import { connection } from "next/server";
import { AdminApiHint, AdminPageHeader } from "@/components/admin/admin-page";
import { CompanyForm } from "@/components/admin/company-form";
import { requireAdminSession } from "@/modules/admin/auth";
import {
  companySettingsComplete,
  getCompanySettings,
} from "@/modules/admin/company-settings";

export default async function AdminCompanyPage() {
  await connection();
  await requireAdminSession("company");
  const settings = await getCompanySettings();
  const complete = companySettingsComplete(settings);

  return (
    <div className="grid gap-6">
      <AdminPageHeader
        description={
          complete
            ? "Профиль заполнен. Публикация на витрину — только явным флагом."
            : "Неполные данные не публикуются на витрину. Пустые/фейковые юр. блоки запрещены."
        }
        title="Company settings"
      />
      <CompanyForm
        initial={{
          orgName: settings.orgName ?? "",
          legalName: settings.legalName ?? "",
          unp: settings.unp ?? "",
          legalAddress: settings.legalAddress ?? "",
          actualAddress: settings.actualAddress ?? "",
          phones: settings.phones ?? "",
          email: settings.email ?? "",
          hours: settings.hours ?? "",
          publishToStorefront: settings.publishToStorefront,
        }}
      />
      <AdminApiHint path="/api/admin/company" />
    </div>
  );
}
