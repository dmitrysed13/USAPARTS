import { describe, expect, it } from "vitest";
import { companySettingsComplete } from "@/modules/admin/company-settings";

describe("company settings publish gate", () => {
  it("requires legal fields before publish", () => {
    expect(
      companySettingsComplete({
        legalName: "ООО Тест",
        unp: "123",
        legalAddress: "Минск",
        phones: "+37529",
        email: "a@b.c",
      }),
    ).toBe(true);
    expect(
      companySettingsComplete({
        legalName: "ООО Тест",
        unp: null,
        legalAddress: "Минск",
        phones: "+37529",
        email: "a@b.c",
      }),
    ).toBe(false);
  });
});
