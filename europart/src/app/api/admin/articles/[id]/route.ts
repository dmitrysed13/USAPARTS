import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import {
  getCmsDocumentById,
  parseCmsDocumentInput,
  updateCmsDocument,
} from "@/modules/content/documents";

export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection();
  const gate = await requireAdminApiAsync(request, "articles");
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await context.params;
  const document = await getCmsDocumentById(id);
  if (!document) {
    return fail(request, `/api/admin/articles/${id}`, "Не найдено.", 404);
  }
  return adminJson({ document });
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ id: string }> },
) {
  await connection();
  const gate = await requireAdminApiAsync(request, "articles");
  if (!gate.ok) {
    return gate.response;
  }
  const { id } = await context.params;
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseCmsDocumentInput(body);
    const row = await updateCmsDocument(id, input);
    return adminJson({ id: row?.id });
  } catch (error) {
    return fail(
      request,
      `/api/admin/articles/${id}`,
      publicError(error, "Материал не обновлён."),
      400,
    );
  }
}
