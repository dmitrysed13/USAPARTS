import { connection } from "next/server";
import { requireAdminApi } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import {
  createDeliveryMethod,
  listAllDeliveryMethods,
} from "@/modules/commerce/delivery";

export async function GET(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  const methods = await listAllDeliveryMethods();
  return adminJson({ methods });
}

export async function POST(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const method = await createDeliveryMethod({
      name: String(body.name ?? ""),
      code: body.code ? String(body.code) : undefined,
      description: body.description ? String(body.description) : undefined,
      requiresAddress: Boolean(body.requiresAddress),
      basePriceCents:
        body.basePriceCents === null || body.basePriceCents === undefined
          ? null
          : Number(body.basePriceCents),
      etaDaysMin:
        body.etaDaysMin === null || body.etaDaysMin === undefined
          ? null
          : Number(body.etaDaysMin),
      etaDaysMax:
        body.etaDaysMax === null || body.etaDaysMax === undefined
          ? null
          : Number(body.etaDaysMax),
      managerConfirmsCost:
        body.managerConfirmsCost === undefined
          ? true
          : Boolean(body.managerConfirmsCost),
      managerConfirmsEta:
        body.managerConfirmsEta === undefined
          ? true
          : Boolean(body.managerConfirmsEta),
      sortOrder: body.sortOrder === undefined ? undefined : Number(body.sortOrder),
    });
    return adminJson({ id: method.id }, 201);
  } catch (error) {
    return fail(
      request,
      "/api/admin/delivery-methods",
      publicError(error, "Не сохранено."),
      400,
    );
  }
}
