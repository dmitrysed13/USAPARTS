import type { AppModule } from "@/modules/types";

export const contentModule = {
  id: "content",
  stage: 9,
  summary:
    "CMS / GEO / content: статьи, инструкции, FAQ, отзывы, контент категорий и авто; SEO + related products. Без авто-спама.",
} satisfies AppModule;

export {
  listCmsDocuments,
  getCmsDocumentById,
  createCmsDocument,
  updateCmsDocument,
  parseCmsDocumentInput,
} from "@/modules/content/documents";
export {
  getPublishedCmsDocument,
  listPublishedCmsDocuments,
  getPublishedCategoryContent,
  getPublishedVehicleContent,
  relatedProductLinks,
  listCmsSitemapEntries,
} from "@/modules/content/public";
export {
  cmsPublicPath,
  cmsIndexPath,
  hasStandalonePublicPage,
} from "@/modules/content/paths";
export {
  CONTENT_KINDS,
  CONTENT_STATUSES,
  contentKindLabels,
  contentStatusLabels,
} from "@/modules/content/labels";
export { splitContentParagraphs, hasUsefulBody } from "@/modules/content/body";
