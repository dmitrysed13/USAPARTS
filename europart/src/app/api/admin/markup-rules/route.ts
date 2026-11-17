import { connection } from "next/server";
import { requireAdminApi } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { createMarkupRule, listMarkupRules } from "@/modules/commerce/markup-rules";

export async function GET(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  const rules = await listMarkupRules();
  return adminJson({
    rules: rules.map((rule) => ({
      id: rule.id,
      name: rule.name,
      scope: rule.scope,
      categoryId: rule.categoryId,
      supplierId: rule.supplierId,
      partBrandId: rule.partBrandId,
      markupType: rule.markupType,
      value: rule.value.toString(),
      b2bValue: rule.b2bValue?.toString() ?? null,
      priority: rule.priority,
      isActive: rule.isActive,
    })),
  });
}

export async function POST(request: Request) {
  await connection();
  const gate = requireAdminApi(request);
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rule = await createMarkupRule({
      name: String(body.name ?? ""),
      scope: body.scope as "GLOBAL" | "CATEGORY" | "SUPPLIER" | "PART_BRAND",
      categoryId: body.categoryId ? String(body.categoryId) : null,
      supplierId: body.supplierId ? String(body.supplierId) : null,
      partBrandId: body.partBrandId ? String(body.partBrandId) : null,
      markupType: body.markupType === "FIXED" ? "FIXED" : "PERCENT",
      value: Number(body.value),
      b2bValue:
        body.b2bValue === null || body.b2bValue === undefined
          ? null
          : Number(body.b2bValue),
      priority: body.priority === undefined ? undefined : Number(body.priority),
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    });
    return adminJson({ id: rule.id }, 201);
  } catch (error) {
    return fail(
      request,
      "/api/admin/markup-rules",
      publicError(error, "Не сохранено."),
      400,
    );
  }
}
