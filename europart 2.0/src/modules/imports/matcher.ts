export type MatchCandidate = {
  id: string;
  name: string;
  articleNormalized: string | null;
  brandKey: string | null;
  oems: string[];
};

export type MatchDecision =
  | { action: "CREATE"; productId: null; message: string | null }
  | { action: "UPDATE"; productId: string; message: string | null }
  | { action: "DUPLICATE"; productId: null; message: string };

export const ProductMatcher = {
  match(
    row: {
      oemNormalized: string | null;
      articleNormalized: string | null;
      brandKey: string | null;
    },
    candidates: MatchCandidate[],
  ): MatchDecision {
    if (row.oemNormalized) {
      const hits = candidates.filter((candidate) =>
        candidate.oems.includes(row.oemNormalized!),
      );
      if (hits.length > 1) {
        return {
          action: "DUPLICATE",
          productId: null,
          message: "Один OEM найден у нескольких товаров. Карточки не объединяются.",
        };
      }
      if (hits.length === 1) {
        return { action: "UPDATE", productId: hits[0].id, message: null };
      }
    }

    if (!row.articleNormalized) {
      return { action: "CREATE", productId: null, message: null };
    }

    const byArticle = candidates.filter(
      (candidate) => candidate.articleNormalized === row.articleNormalized,
    );
    if (row.brandKey) {
      const branded = byArticle.filter(
        (candidate) => candidate.brandKey === row.brandKey,
      );
      if (branded.length > 1) {
        return {
          action: "DUPLICATE",
          productId: null,
          message: "Артикул и бренд совпали у нескольких товаров.",
        };
      }
      if (branded.length === 1) {
        return { action: "UPDATE", productId: branded[0].id, message: null };
      }
      return { action: "CREATE", productId: null, message: null };
    }
    if (byArticle.length > 1) {
      return {
        action: "DUPLICATE",
        productId: null,
        message: "Артикул без бренда найден у нескольких товаров.",
      };
    }
    if (byArticle.length === 1) {
      return { action: "UPDATE", productId: byArticle[0].id, message: null };
    }
    return { action: "CREATE", productId: null, message: null };
  },
};
