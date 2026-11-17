"use server";

import { revalidatePath } from "next/cache";
import { AdminAuthError, requireAdminSession } from "@/modules/admin/auth";
import {
  createCmsDocument,
  parseCmsDocumentInput,
  updateCmsDocument,
} from "@/modules/content/documents";
import { cmsIndexPath, cmsPublicPath } from "@/modules/content/paths";

function revalidateCmsPaths(kind: string, slug: string) {
  revalidatePath("/admin/articles");
  const index = cmsIndexPath(kind as never);
  if (index) {
    revalidatePath(index);
  }
  const publicPath = cmsPublicPath(kind as never, slug);
  if (publicPath && !publicPath.includes("#")) {
    revalidatePath(publicPath);
  }
}

export async function createCmsDocumentAction(
  _prev: { error: string | null; ok: boolean; id: string | null },
  formData: FormData,
): Promise<{ error: string | null; ok: boolean; id: string | null }> {
  try {
    await requireAdminSession("articles");
    const raw = Object.fromEntries(formData.entries());
    const input = parseCmsDocumentInput(raw);
    const row = await createCmsDocument(input);
    if (!row) {
      return { error: "Материал не создан.", ok: false, id: null };
    }
    revalidateCmsPaths(row.kind, row.slug);
    return { error: null, ok: true, id: row.id };
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { error: error.message, ok: false, id: null };
    }
    return {
      error: error instanceof Error ? error.message : "Материал не создан.",
      ok: false,
      id: null,
    };
  }
}

export async function updateCmsDocumentAction(
  _prev: { error: string | null; ok: boolean; id: string | null },
  formData: FormData,
): Promise<{ error: string | null; ok: boolean; id: string | null }> {
  try {
    await requireAdminSession("articles");
    const id = String(formData.get("id") ?? "");
    if (!id) {
      return { error: "Не указан id.", ok: false, id: null };
    }
    const raw = Object.fromEntries(formData.entries());
    const input = parseCmsDocumentInput(raw);
    const row = await updateCmsDocument(id, input);
    if (!row) {
      return { error: "Материал не обновлён.", ok: false, id: null };
    }
    revalidateCmsPaths(row.kind, row.slug);
    revalidatePath(`/admin/articles/${row.id}`);
    return { error: null, ok: true, id: row.id };
  } catch (error) {
    if (error instanceof AdminAuthError) {
      return { error: error.message, ok: false, id: null };
    }
    return {
      error: error instanceof Error ? error.message : "Материал не обновлён.",
      ok: false,
      id: null,
    };
  }
}
