import { connection } from "next/server";
import { notFound } from "next/navigation";
import { AdminBackLink, AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { getPrismaClient } from "@/lib/db/prisma";
import { withDatabase } from "@/lib/db/errors";
import { listVinRequestHistory } from "@/modules/vin/history";

export default async function AdminVinLeadDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await connection();
  await requireAdminSession("vin");
  const { id } = await params;
  const row = await withDatabase(() =>
    getPrismaClient().vinRequest.findUnique({ where: { id } }),
  );
  if (!row) {
    notFound();
  }
  const history = await listVinRequestHistory(id);
  return (
    <div className="grid gap-6">
      <AdminBackLink />
      <AdminPageHeader description={`Статус: ${row.status}`} title={`VIN ${row.vin}`} />
      <dl className="grid gap-2 rounded-2xl border border-line bg-surface p-4 text-sm sm:grid-cols-2">
        <div>
          <dt className="text-ink-muted">Клиент</dt>
          <dd>{row.customerName}</dd>
        </div>
        <div>
          <dt className="text-ink-muted">Телефон / email</dt>
          <dd>
            {row.phone ?? "—"} / {row.email ?? "—"}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Авто</dt>
          <dd>
            {[row.vehicleBrand, row.vehicleModel, row.vehicleYear].filter(Boolean).join(" ") ||
              "—"}
          </dd>
        </div>
        <div>
          <dt className="text-ink-muted">Комментарий</dt>
          <dd>{row.comment ?? "—"}</dd>
        </div>
      </dl>
      <AdminTable
        columns={["When", "From", "To", "Actor", "Comment"]}
        emptyDescription="История пуста."
        emptyTitle="Нет событий"
        rows={history.map((item) => [
          item.createdAt.toISOString().slice(0, 19),
          item.fromStatus ?? "—",
          item.toStatus,
          item.actor,
          item.comment ?? "—",
        ])}
      />
    </div>
  );
}
