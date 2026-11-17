import { describe, expect, it } from "vitest";
import { cacheKey } from "@/lib/cache/redis";
import { appModules } from "@/modules/registry";
import {
  unconfiguredNotifications,
  unconfiguredSupplierCatalog,
} from "@/modules/integrations/ports";

describe("foundation boundaries", () => {
  it("keeps module ids unique", () => {
    const ids = appModules.map((module) => module.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("namespaces cache keys", () => {
    expect(cacheKey("search", "1K0615301AA")).toBe("europart:search:1K0615301AA");
  });

  it("does not pretend an integration succeeded", async () => {
    await expect(
      unconfiguredSupplierCatalog.searchByArticle("1K0615301AA"),
    ).rejects.toThrow(/не подключена/);
    await expect(
      unconfiguredNotifications.send({
        channel: "email",
        subject: "Заказ",
        text: "Текст",
      }),
    ).rejects.toThrow(/не подключена/);
  });
});
