import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("opens the catalog and keeps checkout unavailable", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Автозапчасти EUROPART" }),
    ).toBeTruthy();
    expect(screen.getByText(/Каталог открыт/)).toBeTruthy();
    expect(screen.getByText(/Корзины и онлайн-оплаты/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Открыть каталог" }).getAttribute("href"),
    ).toBe("/catalog");
  });
});
