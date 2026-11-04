import { Menu, Phone, X } from "lucide-react";
import { useEffect, useState } from "react";
import { company, nav } from "../content.ts";
import { track } from "../lib/analytics.ts";
import { MessengerLinks } from "./Messengers.tsx";
import { SiteLink } from "./SiteLink.tsx";
import { Container } from "./ui.tsx";

type HeaderProps = {
  onCallback: () => void;
};

export function Header({ onCallback }: HeaderProps) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const solid = open || scrolled;

  return (
    <header className="sticky top-0 z-50">
      <div
        className={`border-b transition-colors ${solid ? "border-line bg-ink/92 backdrop-blur-md" : "border-transparent bg-ink/40"}`}
      >
      <div className="h-0.5 bg-gradient-to-r from-ember via-[#ffb27a] to-transparent" />
      <Container wide className="flex h-16 items-center gap-3 lg:h-[4.5rem]">
        <SiteLink href="/" className="flex shrink-0 items-center gap-2.5" ariaLabel="USAPARTS, на главную">
          <span className="grid h-10 w-10 place-items-center bg-ember font-display text-lg leading-none text-[#1a0c00]">
            US
          </span>
          <span className="font-display text-[1.7rem] leading-none tracking-[0.12em]">APARTS</span>
        </SiteLink>

        <nav className="ml-6 hidden items-center gap-4 lg:flex" aria-label="Разделы страницы">
          {nav.map((item) => (
            <SiteLink key={item.href} href={item.href} className="text-sm whitespace-nowrap text-mist transition-colors hover:text-paper">
              {item.label}
            </SiteLink>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-2 sm:gap-3">
          <a
            href={company.phoneHref}
            className="hidden items-center gap-2 text-sm font-semibold whitespace-nowrap xl:inline-flex"
            onClick={() => track("phone_click", { place: "header" })}
          >
            <Phone className="h-4 w-4 text-ember" strokeWidth={1.75} aria-hidden="true" />
            {company.phoneDisplay}
          </a>
          <MessengerLinks className="hidden sm:flex" />
          <button type="button" className="btn btn-primary hidden px-4 sm:inline-flex" onClick={onCallback}>
            Заказать звонок
          </button>
          <a
            href={company.phoneHref}
            className="icon-btn sm:hidden"
            aria-label={`Позвонить ${company.phoneDisplay}`}
            onClick={() => track("phone_click", { place: "header" })}
          >
            <Phone className="h-4 w-4" strokeWidth={1.75} />
          </a>
          <button
            type="button"
            className="icon-btn lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((value) => !value)}
          >
            {open ? <X className="h-4 w-4" strokeWidth={1.75} /> : <Menu className="h-4 w-4" strokeWidth={1.75} />}
            <span className="sr-only">{open ? "Закрыть меню" : "Открыть меню"}</span>
          </button>
        </div>
      </Container>
      </div>

      {open ? (
        <div id="mobile-nav" className="fixed inset-x-0 bottom-0 top-[4.125rem] z-40 overflow-y-auto bg-ink px-4 py-6 lg:hidden">
          <nav className="flex flex-col" aria-label="Мобильные разделы">
            {nav.map((item) => (
              <SiteLink
                key={item.href}
                href={item.href}
                className="border-b border-line py-4 font-display text-3xl"
                onClick={() => setOpen(false)}
              >
                {item.label}
              </SiteLink>
            ))}
          </nav>
          <a href={company.phoneHref} className="mt-6 block font-display text-3xl text-ember" onClick={() => track("phone_click", { place: "menu" })}>
            {company.phoneDisplay}
          </a>
          <p className="mt-1 text-sm text-mist">{company.hours}</p>
          <div className="mt-5">
            <MessengerLinks />
          </div>
          <button
            type="button"
            className="btn btn-primary mt-6 w-full"
            onClick={() => {
              setOpen(false);
              onCallback();
            }}
          >
            Заказать звонок
          </button>
        </div>
      ) : null}
    </header>
  );
}
