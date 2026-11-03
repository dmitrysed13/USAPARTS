import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import HomePage from "@/app/page";

describe("home page", () => {
  it("states that the new catalog is not available yet", () => {
    render(<HomePage />);
    expect(
      screen.getByRole("heading", { level: 1, name: "Автозапчасти EUROPART" }),
    ).toBeTruthy();
    expect(screen.getByText(/Каталога, цен и корзины здесь/)).toBeTruthy();
  });
});
