import { updateInquiryStatusAction } from "@/server/actions/admin";
import { prisma } from "@/lib/db";
import { INQUIRY_LABEL } from "@/lib/labels";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function InquiriesAdmin() {
  await requirePermission("inquiries.manage");
  const rows = await prisma.inquiry.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Обращения</h1>
      <div className="mt-4 space-y-3">
        {rows.map((row) => (
          <article key={row.id} className="card p-4 text-sm">
            <p className="font-semibold">{INQUIRY_LABEL[row.type]} · {row.name} · {row.phone}</p>
            <p className="mt-1">{row.message}</p>
            <form action={updateInquiryStatusAction} className="mt-2 flex gap-2">
              <input type="hidden" name="id" value={row.id} />
              <select name="status" defaultValue={row.status} className="field max-w-xs">
                <option>NEW</option><option>IN_PROGRESS</option><option>DONE</option>
              </select>
              <button className="btn-ghost">Статус</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
