import { connection } from "next/server";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { LandingDocument } from "@/components/seo/landing-document";
import { loadLandingPage } from "@/modules/seo/landing-data";
import { landingMetadata } from "@/modules/seo/landing-metadata";
import type { LandingSlug } from "@/modules/seo/landings";

export function createLandingRoute(slug: LandingSlug) {
  async function generateMetadata(): Promise<Metadata> {
    await connection();
    const page = await loadLandingPage(slug);
    if (!page) {
      return {
        title: "Страница не найдена",
        robots: { index: false, follow: false },
      };
    }
    return landingMetadata(page.landing);
  }

  async function Page() {
    await connection();
    const page = await loadLandingPage(slug);
    if (!page) {
      notFound();
    }
    return (
      <LandingDocument
        categories={page.categories}
        landing={page.landing}
        links={page.links}
        products={page.products}
      />
    );
  }

  return { generateMetadata, Page };
}
