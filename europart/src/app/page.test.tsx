import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("opens the catalog and keeps checkout unavailable", () => {
    render(<HomePage />);
    expect(screen.getByRole("heading", { level: 1, name: "EUROPART" })).toBeTruthy();
    expect(screen.getByText(/Европейские автозапчасти/)).toBeTruthy();
    expect(screen.getByText(/без выдуманных данных/)).toBeTruthy();
    expect(
      screen.getByRole("link", { name: "Открыть каталог" }).getAttribute("href"),
    ).toBe("/catalog");
  });
});
