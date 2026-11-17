import { connection } from "next/server";
import Link from "next/link";
import { AdminPageHeader, AdminTable } from "@/components/admin/admin-page";
import { SemanticClusterForm, SeoSettingsForm } from "@/components/admin/seo-forms";
import { requireAdminSession } from "@/modules/admin/auth";
import { listSemanticClusters } from "@/modules/seo/clusters";
import { envIndexingFlag } from "@/modules/seo/policy";
import { getSeoSettingsRow } from "@/modules/seo/settings";

export default async function AdminSeoPage() {
  await connection();
  await requireAdminSession("seo");
  const [settings, clusters] = await Promise.all([
    getSeoSettingsRow(),
    listSemanticClusters(),
  ]);

  return (
    <div className="grid gap-10">
      <AdminPageHeader
        description="Генератор мета, sitemap, schema.org, кластеры и ID аналитики. Мусорные авто-страницы не создаются."
        title="SEO"
      />
      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Индексация и аналитика</h2>
        <SeoSettingsForm
          envIndexingEnabled={envIndexingFlag()}
          initial={{
            indexingEnabled: settings.indexingEnabled,
            ga4MeasurementId: settings.ga4MeasurementId ?? "",
            gscVerification: settings.gscVerification ?? "",
            yandexMetrikaId: settings.yandexMetrikaId ?? "",
            yandexWebmasterVerification: settings.yandexWebmasterVerification ?? "",
            googleMerchantId: settings.googleMerchantId ?? "",
          }}
        />
      </section>
      <section className="grid gap-4">
        <h2 className="font-display text-2xl font-semibold">Семантические кластеры</h2>
        <SemanticClusterForm />
        <AdminTable
          columns={["Name", "Slug", "Intent", "Target", "Keywords"]}
          emptyDescription="Кластеры не создают страницы сами по себе."
          emptyTitle="Кластеров нет"
          rows={clusters.map((row) => [
            row.name,
            row.slug,
            row.intent,
            row.targetPath ?? "—",
            String(row._count.keywords),
          ])}
        />
      </section>
      <p className="text-sm text-ink-muted">
        Редиректы:{" "}
        <Link className="font-semibold text-brand" href="/admin/redirects">
          /admin/redirects
        </Link>
        . Sitemap (при открытой индексации): /sitemap/pages.xml и соседние срезы.
      </p>
    </div>
  );
}
