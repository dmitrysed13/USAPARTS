import type { Metadata } from "next";
import { Suspense } from "react";
import { Manrope, Onest } from "next/font/google";
import { SelectedVehicleBanner } from "@/components/catalog/selected-vehicle";
import { StorefrontRedirectGate } from "@/components/seo/redirect-gate";
import { SiteFooter } from "@/components/layout/site-footer";
import { SiteHeader } from "@/components/layout/site-header";
import { company } from "@/config/company";
import { getSiteUrl } from "@/lib/env";
import { envIndexingFlag } from "@/modules/seo/policy";
import { getSeoAnalyticsIds } from "@/modules/seo/settings";
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
  "EUROPART — европейские автозапчасти для Беларуси. Каталог, поиск по артикулу и заявка по VIN. Корзина и онлайн-оплата ещё не подключены.";

export async function generateMetadata(): Promise<Metadata> {
  const open = envIndexingFlag();
  let verification: Metadata["verification"];
  try {
    const ids = await getSeoAnalyticsIds();
    verification = {
      ...(ids.gscVerification ? { google: ids.gscVerification } : {}),
      ...(ids.yandexWebmasterVerification
        ? { yandex: ids.yandexWebmasterVerification }
        : {}),
      other: {
        ...(ids.ga4MeasurementId ? { "europart-ga4-id": ids.ga4MeasurementId } : {}),
        ...(ids.yandexMetrikaId ? { "europart-metrika-id": ids.yandexMetrikaId } : {}),
        ...(ids.googleMerchantId
          ? { "europart-merchant-id": ids.googleMerchantId }
          : {}),
      },
    };
  } catch {
    verification = undefined;
  }

  return {
    metadataBase: new URL(getSiteUrl()),
    title: {
      default: company.brand,
      template: `%s — ${company.brand}`,
    },
    description,
    applicationName: company.brand,
    robots: open
      ? { index: true, follow: true }
      : { index: false, follow: false },
    verification,
    openGraph: {
      type: "website",
      locale: "ru_BY",
      siteName: company.brand,
      title: company.brand,
      description,
    },
  };
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="ru"
      className={`${manrope.variable} ${onest.variable} h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">
        <Suspense fallback={null}>
          <StorefrontRedirectGate />
        </Suspense>
        <a className="skip-link" href="#content">
          К содержанию
        </a>
        <div className="site-storefront-chrome">
          <SiteHeader />
          <Suspense fallback={null}>
            <SelectedVehicleBanner />
          </Suspense>
        </div>
        <main id="content" className="flex-1">
          {children}
        </main>
        <div className="site-storefront-chrome">
          <Suspense fallback={null}>
            <SiteFooter />
          </Suspense>
        </div>
      </body>
    </html>
  );
}
