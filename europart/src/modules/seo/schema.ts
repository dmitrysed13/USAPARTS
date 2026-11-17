import { absoluteUrl } from "@/modules/seo/canonical";
import type { StorefrontCompany } from "@/modules/admin/company-settings";

export type JsonLd = Record<string, unknown>;

export function breadcrumbJsonLd(
  items: Array<{ name: string; path: string }>,
): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function organizationJsonLd(company: StorefrontCompany): JsonLd {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: "EUROPART",
    url: absoluteUrl("/"),
    email: company.email,
    telephone: company.phoneTel,
  };
  if (company.showLegalBlock && company.legalName) {
    data.legalName = company.legalName;
  }
  if (company.showLegalBlock && company.legalAddress) {
    data.address = {
      "@type": "PostalAddress",
      streetAddress: company.legalAddress,
      addressCountry: "BY",
    };
  }
  return data;
}

export function websiteJsonLd(): JsonLd {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: "EUROPART",
    url: absoluteUrl("/"),
    inLanguage: "ru-BY",
  };
}

export type ProductSchemaInput = {
  name: string;
  path: string;
  description?: string | null;
  sku?: string | null;
  brandName?: string | null;
  imageUrl?: string | null;
  price?: { amount: string; currency: string } | null;
  availability?: "in_stock" | "on_order" | "unknown" | string | null;
};

/**
 * Product + Offer only when price exists. Never emits AggregateRating.
 * Availability maps only from real public availability — no fake InStock claims.
 */
export function productJsonLd(input: ProductSchemaInput): JsonLd {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: input.name,
    url: absoluteUrl(input.path),
  };
  if (input.description) {
    data.description = input.description;
  }
  if (input.sku) {
    data.sku = input.sku;
  }
  if (input.brandName) {
    data.brand = { "@type": "Brand", name: input.brandName };
  }
  if (input.imageUrl) {
    data.image = [input.imageUrl];
  }
  if (input.price?.amount && input.price.currency) {
    const availability =
      input.availability === "in_stock"
        ? "https://schema.org/InStock"
        : input.availability === "on_order"
          ? "https://schema.org/PreOrder"
          : "https://schema.org/OutOfStock";
    data.offers = {
      "@type": "Offer",
      url: absoluteUrl(input.path),
      priceCurrency: input.price.currency,
      price: input.price.amount,
      availability,
    };
  }
  return data;
}

export function articleJsonLd(input: {
  headline: string;
  path: string;
  description?: string | null;
  datePublished?: string | null;
  dateModified?: string | null;
  authorName?: string | null;
  imageUrl?: string | null;
}): JsonLd {
  const data: JsonLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: input.headline,
    url: absoluteUrl(input.path),
    inLanguage: "ru-BY",
  };
  if (input.description) {
    data.description = input.description;
  }
  if (input.datePublished) {
    data.datePublished = input.datePublished;
  }
  if (input.dateModified) {
    data.dateModified = input.dateModified;
  }
  if (input.authorName) {
    data.author = { "@type": "Person", name: input.authorName };
  }
  if (input.imageUrl) {
    data.image = [input.imageUrl];
  }
  return data;
}

/**
 * FAQPage only when real Q&A pairs exist. Empty FAQ must not emit this schema.
 */
export function faqPageJsonLd(
  items: Array<{ question: string; answer: string }>,
): JsonLd | null {
  const usable = items
    .map((item) => ({
      question: item.question.trim(),
      answer: item.answer.trim(),
    }))
    .filter((item) => item.question.length > 0 && item.answer.length >= 20);
  if (usable.length === 0) {
    return null;
  }
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: usable.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

export function jsonLdScript(data: JsonLd | JsonLd[]): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}
