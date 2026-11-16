export type Crumb = { name: string; path: string };

export type PageSection = {
  heading: string;
  paragraphs: string[];
  points?: string[];
};

export type PageFaq = { question: string; answer: string };

export type PageTable = {
  caption: string;
  columns: [string, string, string];
  rows: Array<[string, string, string]>;
};

export type PageCard = { href: string; title: string; text: string };

export type PageFitment = {
  generations: { label: string; href?: string }[];
  engines: string[];
};

export type SeoPage = {
  path: string;
  kind: "home" | "service" | "brand" | "category" | "catalog" | "hub" | "model" | "part" | "generation";
  title: string;
  description: string;
  h1: string;
  lead: string;
  crumbs: Crumb[];
  sections: PageSection[];
  table?: PageTable;
  faq: PageFaq[];
  related: Crumb[];
  cards?: PageCard[];
  fitment?: PageFitment;
  visual?: "sedan" | "crossover" | "suv" | "coupe" | "wagon" | "ev";
  brand?: string;
  modelName?: string;
  part?: string;
  serviceName: string;
};
