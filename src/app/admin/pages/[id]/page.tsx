import { notFound } from "next/navigation";
import { savePageAction } from "@/server/actions/admin";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function EditPageAdmin({ params }: { params: Promise<{ id: string }> }) {
  await requirePermission("pages.write");
  const { id } = await params;
  const page = id === "new" ? null : await prisma.page.findUnique({ where: { id } });
  if (id !== "new" && !page) notFound();
  return (
    <form action={savePageAction} className="grid max-w-3xl gap-3">
      <h1 className="text-2xl font-semibold text-navy">{page ? page.title : "Новая страница"}</h1>
      {page && <input type="hidden" name="id" value={page.id} />}
      <input name="title" required defaultValue={page?.title} className="field" />
      <input name="slug" defaultValue={page?.slug} className="field" />
      <input name="seoTitle" defaultValue={page?.seoTitle ?? ""} className="field" />
      <textarea name="seoDescription" defaultValue={page?.seoDescription ?? ""} className="field" />
      <textarea name="body" defaultValue={page?.body} className="field min-h-64" />
      <label className="text-sm"><input type="checkbox" name="isPublished" defaultChecked={page?.isPublished ?? true} /> Опубликована</label>
      <button className="btn-navy w-fit">Сохранить</button>
    </form>
  );
}
