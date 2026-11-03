import type { AppModule } from "@/modules/types";

export const importsModule = {
  id: "imports",
  stage: 3,
  summary:
    "Прайсы поставщиков проходят предпросмотр до записи. Закупка не попадает в публичный каталог.",
} satisfies AppModule;

export { ImportParser } from "@/modules/imports/parser";
export { ImportNormalizer } from "@/modules/imports/normalizer";
export { ImportValidator } from "@/modules/imports/preview";
export { ProductMatcher } from "@/modules/imports/matcher";
export { DuplicateDetector } from "@/modules/imports/duplicates";
export { ImportPreviewService, ImportService } from "@/modules/imports/service";
export { ImportCommitService } from "@/modules/imports/commit";
export { ImportRollbackService } from "@/modules/imports/rollback";
export { ImportReportService } from "@/modules/imports/report";
