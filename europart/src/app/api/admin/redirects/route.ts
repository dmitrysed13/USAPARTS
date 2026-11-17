import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import { createRedirectRule, listRedirectRules } from "@/modules/admin/redirects";

export async function GET(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "redirects");
  if (!gate.ok) {
    return gate.response;
  }
  const redirects = await listRedirectRules();
  return adminJson({ redirects });
}

export async function POST(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "redirects");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const rule = await createRedirectRule({
      fromPath: String(body.fromPath ?? ""),
      toPath: String(body.toPath ?? ""),
      note: body.note != null ? String(body.note) : undefined,
      isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    });
    return adminJson({ id: rule.id }, 201);
  } catch (error) {
    return fail(
      request,
      "/api/admin/redirects",
      publicError(error, "Редирект не создан."),
      400,
    );
  }
}
