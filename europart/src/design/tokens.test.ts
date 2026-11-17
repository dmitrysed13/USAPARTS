import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { palette } from "@/design/tokens";

describe("design tokens", () => {
  it("keeps the palette in the stylesheet", () => {
    const css = readFileSync(path.join(process.cwd(), "src/app/globals.css"), "utf8");
    for (const color of palette) {
      expect(css).toContain(`${color.cssVariable}: ${color.hex}`);
    }
  });
});
