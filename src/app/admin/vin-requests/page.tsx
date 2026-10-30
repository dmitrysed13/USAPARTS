import { updateVinStatusAction } from "@/server/actions/admin";
import { prisma } from "@/lib/db";
import { VIN_STATUS_LABEL } from "@/lib/labels";
import { requirePermission } from "@/server/guard";

export const dynamic = "force-dynamic";

export default async function VinAdmin() {
  await requirePermission("vin.manage");
  const rows = await prisma.vinRequest.findMany({ orderBy: { createdAt: "desc" }, take: 100 });
  return (
    <div>
      <h1 className="text-2xl font-semibold text-navy">Заявки по VIN</h1>
      <div className="mt-4 space-y-4">
        {rows.map((row) => (
          <article key={row.id} className="card p-4 text-sm">
            <p className="font-semibold">{row.vin} · {row.vinValid ? "контрольная цифра сходится" : "формат не подтверждён"} · декодер: {row.decoderStatus}</p>
            <p>{[row.makeName, row.modelName, row.year].filter(Boolean).join(" ")}</p>
            <p className="mt-1">{row.partDescription}</p>
            <p className="mt-1">{row.phone} · {row.email}</p>
            {row.photoKey && <a className="text-navy underline" href={`/api/admin/vin-photo/${row.id}`}>Фото заявки</a>}
            <form action={updateVinStatusAction} className="mt-2 flex gap-2">
              <input type="hidden" name="id" value={row.id} />
              <select name="status" defaultValue={row.status} className="field max-w-xs">
                {Object.entries(VIN_STATUS_LABEL).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
              </select>
              <button className="btn-ghost" type="submit">Сохранить</button>
            </form>
          </article>
        ))}
      </div>
    </div>
  );
}
