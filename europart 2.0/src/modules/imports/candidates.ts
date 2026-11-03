import "server-only";

import { getPrismaClient } from "@/lib/db/prisma";
import type { MatchCandidate } from "@/modules/imports/matcher";
import { normalizeArticle } from "@/modules/search/normalize-article";

export async function loadMatchCandidates(input: {
  articles: string[];
  oems: string[];
}): Promise<MatchCandidate[]> {
  const articles = [...new Set(input.articles.filter(Boolean))];
  const oems = [...new Set(input.oems.filter(Boolean))];
  if (articles.length === 0 && oems.length === 0) {
    return [];
  }
  const products = await getPrismaClient().product.findMany({
    where: {
      OR: [
        ...(articles.length > 0 ? [{ articleNormalized: { in: articles } }] : []),
        ...(oems.length > 0
          ? [
              {
                identifiers: {
                  some: { type: "OEM" as const, normalizedValue: { in: oems } },
                },
              },
            ]
          : []),
        ...(oems.length > 0 ? [{ oem: { in: oems } }] : []),
      ],
    },
    select: {
      id: true,
      name: true,
      oem: true,
      articleNormalized: true,
      partBrand: { select: { name: true } },
      identifiers: { where: { type: "OEM" }, select: { normalizedValue: true } },
    },
  });

  return products.map((product) => {
    const oemsForProduct = new Set(
      product.identifiers.map((item) => item.normalizedValue),
    );
    if (product.oem) {
      const normalized = normalizeArticle(product.oem);
      if (normalized) {
        oemsForProduct.add(normalized);
      }
    }
    return {
      id: product.id,
      name: product.name,
      articleNormalized: product.articleNormalized,
      brandKey: product.partBrand ? normalizeArticle(product.partBrand.name) : null,
      oems: [...oemsForProduct],
    };
  });
}
