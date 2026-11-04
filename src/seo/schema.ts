import { company, faqs } from "../content.ts";
import { absoluteUrl, siteOrigin } from "./site.ts";
import type { PageFaq, SeoPage } from "./types.ts";

const organizationId = "#organization";

function organization() {
  const origin = siteOrigin();
  return {
    "@type": "AutoPartsStore",
    "@id": organizationId,
    name: company.name,
    legalName: company.legalName,
    taxID: company.unp,
    telephone: "+375297920786",
    email: company.email,
    image: origin ? `${origin}/favicon.svg` : undefined,
    url: origin || undefined,
    address: {
      "@type": "PostalAddress",
      streetAddress: "ул. Московская, 364",
      addressLocality: "Брест",
      addressCountry: "BY",
    },
    openingHoursSpecification: {
      "@type": "OpeningHoursSpecification",
      dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
      opens: "09:00",
      closes: "20:00",
    },
    areaServed: { "@type": "Country", "name": "Беларусь" },
    sameAs: [company.telegram, company.whatsapp],
  };
}

function faqEntity(items: PageFaq[]) {
  return {
    "@type": "FAQPage",
    mainEntity: items.map((item) => ({
      "@type": "Question",
      name: item.question,
      acceptedAnswer: { "@type": "Answer", text: item.answer },
    })),
  };
}

const collectionKinds = new Set(["catalog", "hub", "model", "part", "generation"]);

export function pageGraph(page: SeoPage) {
  const url = absoluteUrl(page.path);
  const isCollection = collectionKinds.has(page.kind);
  const webpage = {
    "@type": isCollection ? "CollectionPage" : "WebPage",
    "@id": `${page.path}#webpage`,
    url,
    name: page.h1,
    description: page.description,
    about: { "@id": organizationId },
    inLanguage: "ru",
  };

  const graph: Record<string, unknown>[] = [];

  if (page.kind === "home") {
    graph.push(
      organization(),
      {
        "@type": "WebSite",
        "@id": "#website",
        name: company.name,
        url: siteOrigin() || undefined,
        inLanguage: "ru",
        publisher: { "@id": organizationId },
      },
      webpage,
      faqEntity(faqs.map((item) => ({ question: item.question, answer: item.answer }))),
    );
  } else {
    graph.push(webpage, {
      "@type": "BreadcrumbList",
      itemListElement: page.crumbs.map((crumb, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: crumb.name,
        item: absoluteUrl(crumb.path),
      })),
    });
    graph.push({
      "@type": "Service",
      name: page.serviceName,
      serviceType: page.serviceName,
      description: page.description,
      url,
      areaServed: { "@type": "Country", "name": "Беларусь" },
      provider: { "@type": "AutoPartsStore", name: company.name, telephone: "+375297920786" },
    });
    if (page.path === "/kontakty/" || page.path === "/o-kompanii/" || isCollection) graph.push(organization());
    if (isCollection) {
      graph.push({
        "@type": "WebSite",
        "@id": "#website",
        name: company.name,
        url: siteOrigin() || undefined,
        inLanguage: "ru",
        publisher: { "@id": organizationId },
      });
    }
    if (page.cards && page.cards.length > 0) {
      graph.push({
        "@type": "ItemList",
        itemListElement: page.cards.map((card, index) => ({
          "@type": "ListItem",
          position: index + 1,
          name: card.title,
          url: absoluteUrl(card.href),
        })),
      });
    }
    if (page.faq.length > 0) graph.push(faqEntity(page.faq));
  }

  return { "@context": "https://schema.org", "@graph": graph };
}
