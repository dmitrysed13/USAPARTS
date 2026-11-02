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

export type SeoPage = {
  path: string;
  kind: "home" | "service" | "brand" | "category";
  title: string;
  description: string;
  h1: string;
  lead: string;
  crumbs: Crumb[];
  sections: PageSection[];
  table?: PageTable;
  faq: PageFaq[];
  related: Crumb[];
  brand?: string;
  part?: string;
  serviceName: string;
};
