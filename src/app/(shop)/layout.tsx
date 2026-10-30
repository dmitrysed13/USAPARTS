import { Footer } from "@/components/footer";
import { Header } from "@/components/header";
import { JsonLd } from "@/components/json-ld";
import { getSettings, getSiteUrl } from "@/lib/site";

export default async function ShopLayout({ children }: { children: React.ReactNode }) {
  const settings = await getSettings();
  const site = getSiteUrl();
  const graph = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": ["Organization", "AutoPartsStore"],
        name: settings.companyName,
        url: site,
        email: settings.email || undefined,
        telephone: settings.phone || undefined,
      },
      {
        "@type": "WebSite",
        name: settings.companyName,
        url: site,
        potentialAction: {
          "@type": "SearchAction",
          target: `${site}/search?q={search_term_string}`,
          "query-input": "required name=search_term_string",
        },
      },
    ],
  };
  return (
    <>
      <JsonLd data={graph} />
      {settings.demoMode && (
        <p className="bg-amber-100 px-4 py-2 text-center text-sm text-amber-950">
          Демонстрационный каталог. Цены, остатки, сроки, отзывы и контакты тестовых карточек не являются офертой и не описывают реальных поставщиков.
        </p>
      )}
      <a href="#content" className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-50 focus:bg-white focus:px-3 focus:py-2">
        К содержанию
      </a>
      <Header />
      <main id="content">{children}</main>
      <Footer />
    </>
  );
}
