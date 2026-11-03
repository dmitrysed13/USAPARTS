import { describe, expect, it } from "vitest";
import { company } from "@/config/company";

describe("company profile", () => {
  it("uses the published Brest contacts", () => {
    expect(company.legalName).toBe("ООО «БелТРЭК»");
    expect(company.phoneTel).toBe("+375297920786");
    expect(company.email).toBe("dmitry.sed13@gmail.com");
    expect(company.streetAddress).toContain("Московская");
    expect(company.currentWebsite).toBe("https://europart.by/");
  });
});
