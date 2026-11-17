import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";
import { getStorefrontCompany } from "@/modules/admin/company-settings";

export async function SiteFooter() {
  const company = await getStorefrontCompany();
  const legalLine = company.showLegalBlock
    ? [company.legalName, company.unp ? `УНП ${company.unp}` : null, company.legalAddress]
        .filter(Boolean)
        .join(". ")
    : "Юридические реквизиты появятся на витрине после заполнения и явной публикации в админке.";

  return (
    <footer className="mt-auto bg-panel text-panel-foreground">
      <Container className="grid gap-8 py-12 sm:grid-cols-2">
        <div>
          <Logo tone="light" />
          <p className="mt-4 max-w-sm text-sm leading-6 text-panel-foreground/75">
            {legalLine} Публичная оферта и политика обработки данных будут опубликованы
            после проверки юристом.
          </p>
        </div>
        <div className="text-sm leading-6">
          <a className="font-semibold hover:text-white" href={`tel:${company.phoneTel}`}>
            {company.phoneDisplay}
          </a>
          <a className="mt-3 block hover:text-white" href={`mailto:${company.email}`}>
            {company.email}
          </a>
          {company.hoursText ? (
            <p className="mt-3 text-panel-foreground/70">{company.hoursText}</p>
          ) : null}
          <nav
            aria-label="Служебные страницы"
            className="mt-4 flex flex-wrap gap-x-4 gap-y-2"
          >
            <Link className="hover:text-white" href="/blog">
              Статьи
            </Link>
            <Link className="hover:text-white" href="/guides">
              Инструкции
            </Link>
            <Link className="hover:text-white" href="/faq">
              FAQ
            </Link>
            <Link className="hover:text-white" href="/privacy">
              Данные заявки
            </Link>
            <Link className="hover:text-white" href="/design-system">
              Дизайн-система
            </Link>
          </nav>
        </div>
      </Container>
    </footer>
  );
}
