import { describe, expect, it } from "vitest";
import { parseCmsDocumentInput } from "@/modules/content/documents";

describe("parseCmsDocumentInput", () => {
  it("accepts a draft article without inventing publish state", () => {
    const input = parseCmsDocumentInput({
      kind: "ARTICLE",
      status: "DRAFT",
      title: "Замена колодок",
      body: "Пошаговая инструкция по замене тормозных колодок на примере типичного дискового тормоза.",
      slug: "zamena-kolodok",
    });
    expect(input.kind).toBe("ARTICLE");
    expect(input.status).toBe("DRAFT");
    expect(input.slug).toBe("zamena-kolodok");
    expect(input.reviewConfirmed).toBe(false);
  });

  it("blocks publishing a review without confirmation", () => {
    expect(() =>
      parseCmsDocumentInput({
        kind: "REVIEW",
        status: "PUBLISHED",
        title: "Отзыв",
        body: "Купил колодки, всё подошло, доставка вовремя, менеджер помог с подбором.",
        reviewConfirmed: false,
      }),
    ).toThrow(/подтверждения/i);
  });

  it("requires categoryId for CATEGORY_CONTENT", () => {
    expect(() =>
      parseCmsDocumentInput({
        kind: "CATEGORY_CONTENT",
        status: "DRAFT",
        title: "Текст категории",
        body: "Полезное описание раздела каталога с техническими нюансами подбора.",
      }),
    ).toThrow(/categoryId/i);
  });
});
