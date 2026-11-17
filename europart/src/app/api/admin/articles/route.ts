import { connection } from "next/server";
import { requireAdminApiAsync } from "@/modules/admin/guard";
import { adminJson, fail, publicError } from "@/modules/admin/respond";
import {
  createCmsDocument,
  listCmsDocuments,
  parseCmsDocumentInput,
} from "@/modules/content/documents";
import { isContentKind, isContentStatus } from "@/modules/content/labels";

export async function GET(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "articles");
  if (!gate.ok) {
    return gate.response;
  }
  const url = new URL(request.url);
  const kindRaw = url.searchParams.get("kind");
  const statusRaw = url.searchParams.get("status");
  const kind = kindRaw && isContentKind(kindRaw) ? kindRaw : undefined;
  const status = statusRaw && isContentStatus(statusRaw) ? statusRaw : undefined;
  const documents = await listCmsDocuments({ kind, status });
  return adminJson({
    documents: documents.map((row) => ({
      id: row.id,
      kind: row.kind,
      status: row.status,
      slug: row.slug,
      title: row.title,
      publishedAt: row.publishedAt,
      updatedAt: row.updatedAt,
      reviewConfirmed: row.reviewConfirmed,
    })),
  });
}

export async function POST(request: Request) {
  await connection();
  const gate = await requireAdminApiAsync(request, "articles");
  if (!gate.ok) {
    return gate.response;
  }
  try {
    const body = (await request.json()) as Record<string, unknown>;
    const input = parseCmsDocumentInput(body);
    const row = await createCmsDocument(input);
    return adminJson({ id: row?.id }, 201);
  } catch (error) {
    return fail(
      request,
      "/api/admin/articles",
      publicError(error, "Материал не создан."),
      400,
    );
  }
}
