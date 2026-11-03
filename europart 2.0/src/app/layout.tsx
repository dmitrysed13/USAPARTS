import type { Metadata } from "next";
import { Manrope, Onest } from "next/font/google";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { company } from "@/config/company";
import { getSiteUrl } from "@/lib/env";
import "./globals.css";

const manrope = Manrope({
  subsets: ["latin", "cyrillic"],
  variable: "--font-manrope",
  display: "swap",
});

const onest = Onest({
  subsets: ["latin", "cyrillic"],
  variable: "--font-onest",
  display: "swap",
});

const description =
  "Новая платформа EUROPART готовится к запуску. Каталог и оформление заказа ещё не подключены. Заявку можно оставить на europart.by или по телефону в Бресте.";

export const metadata: Metadata = {
  metadataBase: new URL(getSiteUrl()),
  title: {
    default: company.brand,
    template: `%s — ${company.brand}`,
  },
  description,
  applicationName: company.brand,
  robots: {
    index: false,
    follow: false,
  },
  openGraph: {
    type: "website",
    locale: "ru_BY",
    siteName: company.brand,
    title: company.brand,
    description,
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${onest.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <a className="skip-link" href="#content">
          К содержанию
        </a>
        <SiteHeader />
        <main id="content" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  );
}
