import type { Metadata } from "next";
import { company } from "@/config/company";
import { fullTitle, type ResolvedLanding } from "@/modules/seo/landings";

export function landingMetadata(landing: ResolvedLanding): Metadata {
  const title = fullTitle(landing.title);
  return {
    title: { absolute: title },
    description: landing.description,
    alternates: { canonical: landing.canonicalPath },
    robots: {
      index: landing.indexable,
      follow: true,
    },
    openGraph: {
      title,
      description: landing.description,
      url: landing.canonicalPath,
      type: "website",
      locale: "ru_BY",
      siteName: company.brand,
    },
  };
}
