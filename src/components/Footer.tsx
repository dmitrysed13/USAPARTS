import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { company, nav } from "../content.ts";
import { track } from "../lib/analytics.ts";
import { MessengerLinks } from "./Messengers.tsx";
import { SiteLink } from "./SiteLink.tsx";
import { Container } from "./ui.tsx";

type FooterProps = {
  onPrivacy: () => void;
};

export function Footer({ onPrivacy }: FooterProps) {
  return (
    <footer id="contacts" className="border-t border-line bg-ink pb-28 sm:pb-0 max-sm:pr-16">
      <Container className="grid gap-10 py-14 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="relative min-h-64 overflow-hidden border border-line bg-[#0c1116]">
            <svg viewBox="0 0 480 280" className="absolute inset-0 h-full w-full" aria-hidden="true" preserveAspectRatio="xMidYMid slice">
              <rect width="480" height="280" fill="#0c1116" />
              <g stroke="#243140" strokeWidth="14" fill="none">
                <path d="M-20 70h520" />
                <path d="M-20 168h520" />
                <path d="M-20 230h520" />
                <path d="M90 -20v320" />
                <path d="M230 -20v320" />
                <path d="M360 -20v320" />
              </g>
              <g stroke="#1a2633" strokeWidth="3">
                <path d="M-20 118h520" />
                <path d="M160 -20v320" />
                <path d="M300 -20v320" />
              </g>
              <circle cx="230" cy="168" r="7" fill="#ff6b00" />
              <circle cx="230" cy="168" r="18" fill="none" stroke="#ff6b00" strokeOpacity="0.65" />
            </svg>
            <div className="relative flex min-h-64 flex-col justify-end p-5">
              <p className="inline-flex items-center gap-2 text-sm font-semibold text-ember">
                <MapPin className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
                Склад USAPARTS
              </p>
              <p className="mt-2 max-w-xs text-sm leading-relaxed">{company.address}</p>
            </div>
          </div>
          <p className="mt-3 text-sm text-mist">{company.addressNote}</p>
        </div>

        <div className="lg:col-span-4">
          <p className="eyebrow">Контакты</p>
          <a href={company.phoneHref} className="mt-4 flex items-center gap-2 font-display text-3xl leading-none whitespace-nowrap sm:text-4xl" onClick={() => track("phone_click", { place: "footer" })}>
            <Phone className="h-6 w-6 text-ember" strokeWidth={1.75} aria-hidden="true" />
            {company.phoneDisplay}
          </a>
          <p className="mt-3 inline-flex items-center gap-2 text-sm text-mist">
            <Clock className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            {company.hours}
          </p>
          <a href={`mailto:${company.email}`} className="mt-2 flex items-center gap-2 text-sm hover:text-ember">
            <Mail className="h-4 w-4 text-ember" strokeWidth={1.75} aria-hidden="true" />
            {company.email}
          </a>
          <div className="mt-5">
            <MessengerLinks />
          </div>
          <div className="mt-6 text-sm leading-relaxed text-mist">
            <p className="font-semibold text-paper">{company.legalName}</p>
            <p className="mt-1">УНП {company.unp}</p>
          </div>
        </div>

        <div className="lg:col-span-3">
          <p className="eyebrow">Разделы</p>
          <nav className="mt-4 flex flex-col items-start gap-2" aria-label="Разделы в подвале">
            {nav.map((item) => (
              <SiteLink key={item.href} href={item.href} className="text-sm text-mist hover:text-paper">
                {item.label}
              </SiteLink>
            ))}
            <SiteLink href="/#podbor" className="text-sm text-mist hover:text-paper">
              Подобрать запчасть
            </SiteLink>
            <SiteLink href="/dostavka-iz-ssha/" className="text-sm text-mist hover:text-paper">
              Доставка
            </SiteLink>
            <SiteLink href="/podbor-po-vin/" className="text-sm text-mist hover:text-paper">
              Подбор по VIN
            </SiteLink>
          </nav>
        </div>
      </Container>

      <div className="border-t border-line">
        <Container className="flex flex-col gap-3 py-5 text-sm text-mist sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} {company.name}. Запчасти для американских авто.</p>
          <button type="button" className="link w-fit text-left" onClick={onPrivacy}>
            Политика конфиденциальности
          </button>
        </Container>
      </div>
    </footer>
  );
}
