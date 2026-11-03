import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { company, formatAddress } from "@/config/company";

export function SiteFooter() {
  return (
    <footer className="mt-auto bg-panel text-panel-foreground">
      <Container className="grid gap-8 py-12 sm:grid-cols-2">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-panel-foreground/75">
            {company.legalName}. {formatAddress()}. Публичная оферта и политика обработки
            данных будут опубликованы после проверки юристом.
          </p>
        </div>
        <div className="text-sm leading-6">
          <a className="font-semibold hover:text-white" href={`tel:${company.phoneTel}`}>
            {company.phoneDisplay}
          </a>
          <p className="text-panel-foreground/70">{company.phoneNote}</p>
          <a className="mt-3 block hover:text-white" href={`mailto:${company.email}`}>
            {company.email}
          </a>
          <p className="mt-3 text-panel-foreground/70">
            {company.hours.map((slot) => `${slot.days}: ${slot.time}`).join(" · ")}
          </p>
        </div>
      </Container>
    </footer>
  );
}
