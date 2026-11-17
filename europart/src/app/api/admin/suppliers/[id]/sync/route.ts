import { connection } from "next/server";
import { requireAdminApi } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { runSupplierSync } from "@/modules/integrations/supplier-adapter";

type Params = { params: Promise<{ id: string }> };

export async function POST(request: Request, { params }: Params) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await params;
  try {
    const body = (await request.json().catch(() => ({}))) as { kind?: string };
    const kind =
      body.kind === "PRODUCTS" ||
      body.kind === "PRICES" ||
      body.kind === "STOCK" ||
      body.kind === "FULL"
        ? body.kind
        : "FULL";
    const result = await runSupplierSync({ supplierId: id, kind });
    return adminJson(result);
  } catch (error) {
    return fail(
      request,
      `/api/admin/suppliers/${id}/sync`,
      publicError(error, "Синхронизация не выполнена."),
      400,
    );
  }
}
