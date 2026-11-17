import { connection } from "next/server";
import Link from "next/link";
import { AdminPageHeader } from "@/components/admin/admin-page";
import { requireAdminSession } from "@/modules/admin/auth";
import { formatMoneyCents, getAnalyticsKpis } from "@/modules/analytics/kpi";
import { getSeoAnalyticsIds } from "@/modules/seo/settings";

function SourceTable({
  title,
  rows,
}: {
  title: string;
  rows: Array<{
    source: string;
    orders: number;
    revenueCents: number;
    leads: number;
  }>;
}) {
  return (
    <section className="grid gap-3">
      <h2 className="font-display text-xl font-semibold">{title}</h2>
      {rows.length === 0 ? (
        <p className="text-sm text-ink-muted">Пока нет данных по источникам.</p>
      ) : (
        <div className="overflow-x-auto rounded-2xl border border-line">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-surface-muted text-ink-muted">
              <tr>
                <th className="px-3 py-2 font-medium">Источник</th>
                <th className="px-3 py-2 font-medium">Заказы</th>
                <th className="px-3 py-2 font-medium">Выручка</th>
                <th className="px-3 py-2 font-medium">Лиды</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row) => (
                <tr className="border-t border-line" key={`${title}-${row.source}`}>
                  <td className="px-3 py-2 font-medium">{row.source}</td>
                  <td className="px-3 py-2">{row.orders}</td>
                  <td className="px-3 py-2">{formatMoneyCents(row.revenueCents)}</td>
                  <td className="px-3 py-2">{row.leads}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

export default async function AdminAnalyticsPage() {
  await connection();
  await requireAdminSession("dashboard");
  const [kpi, ids] = await Promise.all([getAnalyticsKpis(30), getSeoAnalyticsIds()]);

  const cards = [
    { label: "Заказы (30 дн.)", value: String(kpi.orders) },
    { label: "Оплаченные", value: String(kpi.paidOrders) },
    { label: "Выручка", value: formatMoneyCents(kpi.revenueCents) },
    { label: "AOV", value: formatMoneyCents(kpi.aovCents) },
    { label: "Лиды", value: String(kpi.leads) },
    { label: "VIN-заявки", value: String(kpi.vinLeads) },
    {
      label: "Заказы / лид",
      value:
        kpi.conversionOrdersPerLead == null
          ? "—"
          : String(kpi.conversionOrdersPerLead),
    },
  ];

  return (
    <div className="grid gap-8">
      <AdminPageHeader
        description="KPI из заказов и лидов. Атрибуция — только UTM/source без телефонов, email и VIN. GA/Metrika ID задаются в SEO или env."
        title="Analytics"
      />
      <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((card) => (
          <li
            className="rounded-2xl border border-line bg-surface p-4"
            key={card.label}
          >
            <p className="text-sm text-ink-muted">{card.label}</p>
            <p className="mt-2 font-display text-2xl font-semibold">{card.value}</p>
          </li>
        ))}
      </ul>
      <section className="rounded-2xl border border-line bg-surface-muted p-4 text-sm">
        <h2 className="font-display text-lg font-semibold">Счётчики</h2>
        <dl className="mt-3 grid gap-2 sm:grid-cols-2">
          <div>
            <dt className="text-ink-muted">GA4</dt>
            <dd className="font-medium">{ids.ga4MeasurementId ?? "не задан (no-op)"}</dd>
          </div>
          <div>
            <dt className="text-ink-muted">Yandex Metrika</dt>
            <dd className="font-medium">{ids.yandexMetrikaId ?? "не задан (no-op)"}</dd>
          </div>
        </dl>
        <p className="mt-3 text-ink-muted">
          Пустые ID = скрипты и события не отправляются. Настройка:{" "}
          <Link className="text-brand" href="/admin/seo">
            SEO
          </Link>{" "}
          или env `GA4_MEASUREMENT_ID` / `YANDEX_METRIKA_ID`.
        </p>
      </section>
      <SourceTable rows={kpi.firstTouch} title="First-touch source" />
      <SourceTable rows={kpi.lastTouch} title="Last-touch source" />
    </div>
  );
}
