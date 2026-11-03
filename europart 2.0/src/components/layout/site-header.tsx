import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { Container } from "@/components/ui/container";

const links = [
  { href: "/#contacts", label: "Контакты" },
  { href: "/design-system", label: "Дизайн-система" },
] as const;

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-20 border-b border-line bg-surface/95 backdrop-blur">
      <Container className="flex flex-wrap items-center gap-x-4 gap-y-2 py-3 sm:h-16 sm:flex-nowrap sm:py-0">
        <Link aria-label="EUROPART, на главную" className="shrink-0" href="/">
          <Logo />
        </Link>
        <nav
          aria-label="Разделы"
          className="ml-auto flex items-center gap-4 text-sm font-medium sm:gap-6"
        >
          {links.map((link) => (
            <Link
              className="whitespace-nowrap text-ink hover:text-brand"
              href={link.href}
              key={link.href}
            >
              {link.label}
            </Link>
          ))}
        </nav>
      </Container>
    </header>
  );
}
