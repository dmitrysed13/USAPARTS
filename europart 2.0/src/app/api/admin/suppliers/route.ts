import { connection } from "next/server";
import { requireAdminApi } from "@/modules/admin/guard";
import {
  adminJson,
  fail,
  formText,
  publicError,
  wantsHtml,
} from "@/modules/admin/respond";
import { createSupplier, listSuppliers, supplierError } from "@/modules/admin/suppliers";

export async function GET(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  const suppliers = await listSuppliers();
  return adminJson({
    suppliers: suppliers.map((supplier) => ({
      id: supplier.id,
      name: supplier.name,
      code: supplier.code,
      isActive: supplier.isActive,
      apiEnabled: supplier.apiEnabled,
    })),
  });
}

export async function handleSupplierCreate(request: Request): Promise<Response> {
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const form = await request.formData();
    const supplier = await createSupplier({
      name: formText(form, "name"),
      code: formText(form, "code"),
      email: formText(form, "email"),
      phone: formText(form, "phone"),
      note: formText(form, "note"),
      apiEnabled: form.get("apiEnabled") === "on" || form.get("apiEnabled") === "true",
      credentialsEnvKey: formText(form, "credentialsEnvKey"),
    });
    if (wantsHtml(request)) {
      return new Response(null, {
        status: 303,
        headers: { location: `/admin/suppliers/${supplier.id}` },
      });
    }
    return adminJson({ id: supplier.id }, 201);
  } catch (error) {
    try {
      return fail(request, "/admin/suppliers/new", supplierError(error), 400);
    } catch (unknownError) {
      return fail(
        request,
        "/admin/suppliers/new",
        publicError(unknownError, "Не сохранено."),
        400,
      );
    }
  }
}

export async function POST(request: Request) {
  await connection();
  return handleSupplierCreate(request);
}
