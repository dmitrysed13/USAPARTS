import Link from "next/link";
import { prisma } from "@/lib/db";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function PagesAdmin() {
  await requirePermission("pages.write");
  const pages = await prisma.page.findMany({ orderBy: { title: "asc" } });
  return (
    <div>
      <div className="flex justify-between"><h1 className="text-2xl font-semibold text-navy">Страницы</h1><Link className="btn-navy" href="/admin/pages/new">Новая</Link></div>
      <ul className="mt-4 text-sm">{pages.map((page) => <li key={page.id} className="border-b border-line py-2"><Link className="text-navy underline" href={`/admin/pages/${page.id}`}>{page.title}</Link> · /info/{page.slug}</li>)}</ul>
    </div>
  );
}
