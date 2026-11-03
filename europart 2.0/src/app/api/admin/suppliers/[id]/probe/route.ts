import { connection } from "next/server";
import { IntegrationNotConfiguredError } from "@/modules/integrations/ports";
import { requireAdminApi } from "@/modules/admin/guard";
import { probeSupplierApi } from "@/modules/admin/probe";
import { adminJson, fail } from "@/modules/admin/respond";

export async function handleSupplierProbe(
  request: Request,
  supplierId: string,
): Promise<Response> {
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  try {
    await probeSupplierApi(supplierId);
    return adminJson({ ok: false, message: "Интеграция не подключена." }, 501);
  } catch (error) {
    const message =
      error instanceof IntegrationNotConfiguredError
        ? error.message
        : "Интеграция не подключена.";
    return fail(request, `/admin/suppliers/${supplierId}`, message, 501);
  }
}

export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection();
  const { id } = await context.params;
  return handleSupplierProbe(request, id);
}
