import { connection } from "next/server";
import { Breadcrumbs } from "@/components/catalog/breadcrumbs";
import { VinRequestForm } from "@/components/vin/vin-request-form";
import { Container } from "@/components/ui/container";
import { closedMetadata } from "@/lib/seo/closed";

export const metadata = closedMetadata({
  title: "Заявка по VIN",
  description:
    "Заявка менеджеру EUROPART. VIN не расшифровывается автоматически: номер и контакт сохраняются для ручной проверки.",
  canonical: "/vin-search",
});

function one(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();
  return trimmed ? trimmed.slice(0, 160) : undefined;
}

export default async function VinSearchPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  await connection();
  const query = await searchParams;

  return (
    <Container className="grid gap-8 py-10">
      <Breadcrumbs
        items={[{ href: "/", label: "Главная" }, { label: "Заявка по VIN" }]}
      />
      <div className="max-w-3xl">
        <h1 className="font-display text-4xl font-semibold tracking-tight">
          Заявка по VIN
        </h1>
        <p className="mt-3 leading-7 text-ink-muted">
          Номер, комментарий и контакт сохраняются в базе со статусом «новая» и
          историей заявки. Автоматической расшифровки VIN нет и не будет подставляться
          выдуманная марка/модель. Уведомление менеджеру уходит только если SMTP/Telegram
          настроены.
        </p>
      </div>
      <div className="max-w-3xl">
        <VinRequestForm
          defaults={{
            partName: one(query.partName),
            partNumber: one(query.partNumber),
          }}
        />
      </div>
    </Container>
  );
}
