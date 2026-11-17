import { describe, expect, it } from "vitest";
import { formatLeadTime } from "@/modules/commerce/availability";

describe("lead time", () => {
  it("does not invent a deadline", () => {
    expect(formatLeadTime(null)).toBe("Срок уточняется");
    expect(formatLeadTime(0)).toBe("Сегодня");
    expect(formatLeadTime(1)).toBe("1 день");
    expect(formatLeadTime(2)).toBe("2 дня");
    expect(formatLeadTime(5)).toBe("5 дней");
    expect(formatLeadTime(21)).toBe("21 день");
  });
});
