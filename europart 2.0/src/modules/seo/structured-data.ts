import { company, formatAddress } from "@/config/company";
import type { PublicProduct } from "@/modules/catalog/public-dto";
import type { FaqItem } from "@/modules/seo/landings";

type JsonObject = Record<string, unknown>;

function compact(value: JsonObject): JsonObject {
  return Object.fromEntries(
    Object.entries(value).filter(([, item]) => item !== undefined),
  );
}

export function organizationStructuredData(siteUrl: string): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: company.brand,
    legalName: company.legalName,
    url: siteUrl,
    email: company.email,
    telephone: company.phoneTel,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.streetAddress,
      addressLocality: company.city,
      addressCountry: "BY",
    },
  };
}

export function websiteStructuredData(siteUrl: string): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: company.brand,
    url: siteUrl,
    inLanguage: "ru",
  };
}

export function storeStructuredData(siteUrl: string): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "AutoPartsStore",
    name: company.brand,
    url: `${siteUrl}/magazin-avtozapchastey`,
    telephone: company.phoneTel,
    email: company.email,
    address: {
      "@type": "PostalAddress",
      streetAddress: company.streetAddress,
      addressLocality: company.city,
      addressCountry: "BY",
    },
    openingHoursSpecification: [
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday"],
        opens: "09:00",
        closes: "21:00",
      },
      {
        "@type": "OpeningHoursSpecification",
        dayOfWeek: ["Saturday", "Sunday"],
        opens: "11:00",
        closes: "19:00",
      },
    ],
    parentOrganization: {
      "@type": "Organization",
      name: company.legalName,
      address: formatAddress(),
    },
  };
}

export function breadcrumbStructuredData(
  items: Array<{ href?: string; label: string }>,
  siteUrl: string,
): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) =>
      compact({
        "@type": "ListItem",
        position: index + 1,
        name: item.label,
        item: item.href ? new URL(item.href, siteUrl).href : undefined,
      }),
    ),
  };
}

export function faqStructuredData(faq: FaqItem[]): JsonObject {
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: item.answer,
      },
    })),
  };
}

const offerAvailability: Record<PublicProduct["availability"], string | null> = {
  in_stock: "https://schema.org/InStock",
  low_stock: "https://schema.org/InStock",
  on_order: "https://schema.org/PreOrder",
  incoming: "https://schema.org/PreOrder",
  out_of_stock: "https://schema.org/OutOfStock",
  discontinued: "https://schema.org/Discontinued",
  unknown: null,
};

export function productStructuredData(
  product: PublicProduct,
  siteUrl: string,
): JsonObject | null {
  if (!product.price) {
    return null;
  }
  const availability = offerAvailability[product.availability];
  return compact({
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    sku: product.article ?? undefined,
    description: product.description ?? undefined,
    image:
      product.images.length > 0 ? product.images.map((image) => image.url) : undefined,
    brand: product.partBrand
      ? { "@type": "Brand", name: product.partBrand.name }
      : undefined,
    offers: compact({
      "@type": "Offer",
      price: product.price.amount,
      priceCurrency: product.price.currency,
      url: `${siteUrl}/product/${product.slug}`,
      availability: availability ?? undefined,
    }),
  });
}
