import type { Metadata } from "next";
import { absoluteUrl, canonicalAlternates } from "@/modules/seo/canonical";
import { decideIndex } from "@/modules/seo/policy";
import {
  applySeoTemplate,
  type SeoTemplateKind,
  type SeoTemplateVars,
} from "@/modules/seo/templates";
import type { SeoOverlay } from "@/modules/seo/overlay";

export type BuildSeoInput = {
  kind: SeoTemplateKind;
  vars: SeoTemplateVars;
  path: string;
  indexingEnabled: boolean;
  hasQualityContent: boolean;
  overlay?: Partial<SeoOverlay> | null;
  ogImageUrl?: string | null;
  robotsMode?: "AUTO" | "INDEX" | "NOINDEX";
};

export type BuiltSeo = {
  title: string;
  description: string;
  h1: string;
  seoText: string | null;
  canonicalPath: string;
  index: boolean;
  follow: boolean;
  reason: string;
  metadata: Metadata;
};

export function buildSeo(input: BuildSeoInput): BuiltSeo {
  const generated = applySeoTemplate(input.kind, input.vars);
  const title = input.overlay?.title?.trim() || generated.title;
  const description =
    input.overlay?.description?.trim() || generated.description || null;
  const h1 = input.overlay?.h1?.trim() || generated.h1;
  const canonicalPath =
    input.overlay?.canonicalPath?.trim() || input.path;
  const seoText = input.overlay?.seoText?.trim() || null;
  const robotsMode = input.robotsMode ?? input.overlay?.robotsMode ?? "AUTO";
  const decision = decideIndex({
    indexingEnabled: input.indexingEnabled,
    path: canonicalPath,
    hasQualityContent: input.hasQualityContent,
    robotsMode,
  });
  const ogImage = input.ogImageUrl?.trim() || input.overlay?.ogImageUrl?.trim() || null;
  const abs = absoluteUrl(canonicalPath);

  const metadata: Metadata = {
    title,
    description: description || undefined,
    alternates: canonicalAlternates(canonicalPath),
    robots: {
      index: decision.index,
      follow: decision.follow,
    },
    openGraph: {
      type: input.kind === "product" ? "website" : "website",
      locale: "ru_BY",
      siteName: "EUROPART",
      title,
      description: description || undefined,
      url: abs,
      ...(ogImage ? { images: [{ url: ogImage }] } : {}),
    },
  };

  return {
    title,
    description: description ?? "",
    h1,
    seoText,
    canonicalPath,
    index: decision.index,
    follow: decision.follow,
    reason: decision.reason,
    metadata,
  };
}
