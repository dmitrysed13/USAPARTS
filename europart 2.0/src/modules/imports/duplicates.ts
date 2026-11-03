import type { NormalizedRow } from "@/modules/imports/normalizer";

export type DuplicateLine = {
  action: "CREATE" | "UPDATE" | "ERROR" | "DUPLICATE";
  message: string | null;
  productId: string | null;
  normalized: NormalizedRow;
};

export const DuplicateDetector = {
  mark<T extends DuplicateLine>(lines: T[]): T[] {
    const groups = new Map<string, number[]>();
    const add = (key: string, index: number) => {
      const current = groups.get(key) ?? [];
      current.push(index);
      groups.set(key, current);
    };

    lines.forEach((line, index) => {
      if (line.action === "ERROR") {
        return;
      }
      if (line.normalized.oemNormalized) {
        add(`oem:${line.normalized.oemNormalized}`, index);
      }
      if (line.normalized.articleNormalized) {
        add(
          `article:${line.normalized.articleNormalized}:${line.normalized.brandKey ?? ""}`,
          index,
        );
      }
    });

    const reasons = new Map<number, string[]>();
    for (const [key, indexes] of groups) {
      if (indexes.length < 2) {
        continue;
      }
      const reason = key.startsWith("oem:")
        ? "В файле повторяется один OEM."
        : "В файле повторяется артикул этого бренда.";
      for (const index of indexes) {
        const list = reasons.get(index) ?? [];
        list.push(reason);
        reasons.set(index, list);
      }
    }

    return lines.map((line, index) => {
      const reason = reasons.get(index);
      if (!reason) {
        return line;
      }
      return {
        ...line,
        action: "DUPLICATE",
        productId: null,
        message: [...new Set(reason)].join(" "),
      };
    });
  },
};
