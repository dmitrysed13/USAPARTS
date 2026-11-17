import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import {
  companySettingsComplete,
  getCompanySettings,
  updateCompanySettings,
} from "@/modules/admin/company-settings";

export async function GET(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "company");
  if (!gate.ok) {
    return gate.response;
  }
  const settings = await getCompanySettings();
  return adminJson({
    settings: {
      ...settings,
      complete: companySettingsComplete(settings),
    },
  });
}

export async function PUT(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "company");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const settings = await updateCompanySettings({
      orgName: body.orgName != null ? String(body.orgName) : undefined,
      legalName: body.legalName != null ? String(body.legalName) : undefined,
      unp: body.unp != null ? String(body.unp) : undefined,
      legalAddress: body.legalAddress != null ? String(body.legalAddress) : undefined,
      actualAddress:
        body.actualAddress != null ? String(body.actualAddress) : undefined,
      phones: body.phones != null ? String(body.phones) : undefined,
      email: body.email != null ? String(body.email) : undefined,
      hours: body.hours != null ? String(body.hours) : undefined,
      publishToStorefront:
        body.publishToStorefront === undefined
          ? undefined
          : Boolean(body.publishToStorefront),
    });
    return adminJson({ settings });
  } catch (error) {
    return fail(
      request,
      "/api/admin/company",
      publicError(error, "Не сохранено."),
      400,
    );
  }
}
