import { describe, expect, it } from "vitest";
import {
  customerOrderCreatedTemplate,
  managerLeadTemplate,
  managerOrderCreatedTemplate,
  managerVinRequestTemplate,
} from "@/modules/notifications/templates";

describe("notification templates", () => {
  it("builds manager and customer order copy without claiming payment success", () => {
    const payload = {
      number: "EP-2026-000001",
      accessToken: "token",
      customerName: "Иван",
      customerPhone: "+375291112233",
      customerEmail: "a@example.com",
      totalCents: 12500,
      checkoutMode: "MANAGER" as const,
    };
    expect(managerOrderCreatedTemplate(payload).subject).toContain("EP-2026-000001");
    expect(customerOrderCreatedTemplate(payload).text).toMatch(/Менеджер свяжется/);
    expect(customerOrderCreatedTemplate(payload).text).not.toMatch(/оплачен успешно/i);
  });

  it("builds lead template for price requests", () => {
    const lead = managerLeadTemplate({
      type: "PRICE_REQUEST",
      name: "Анна",
      phone: null,
      email: "b@example.com",
      message: "Нужна цена",
      article: "GDB1",
    });
    expect(lead.text).toContain("GDB1");
    expect(lead.subject).toContain("PRICE_REQUEST");
  });

  it("builds VIN request template without claiming decode", () => {
    const vin = managerVinRequestTemplate({
      id: "vin-1",
      vin: "WVWZZZ3CZWE123456",
      vinIsStandard: true,
      customerName: "Иван",
      phone: "+375291112233",
      email: null,
      comment: "Нужны колодки",
      partName: "Колодки",
      partNumber: "1K0615301AA",
      vehicleBrand: "VW",
      vehicleModel: "Golf",
      vehicleYear: 2015,
    });
    expect(vin.subject).toContain("WVWZZZ3CZWE123456");
    expect(vin.text).toMatch(/Автоматической расшифровки VIN нет/);
    expect(vin.text).not.toMatch(/расшифрован успешно/i);
  });
});
