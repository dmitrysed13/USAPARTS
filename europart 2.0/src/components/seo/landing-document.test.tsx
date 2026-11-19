import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LandingDocument } from "@/components/seo/landing-document";
import { getLanding, resolveLanding } from "@/modules/seo/landings";

describe("landing document", () => {
  it("renders one heading and the visible faq", () => {
    const definition = getLanding("avtozapchasti");
    expect(definition).not.toBeNull();
    const landing = resolveLanding(definition!, null, 0);
    render(
      <LandingDocument
        categories={[]}
        landing={landing}
        links={landing.links}
        products={[]}
      />,
    );
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1);
    expect(screen.getByRole("heading", { level: 1, name: landing.h1 })).toBeTruthy();
    expect(screen.getByText(landing.faq[0].question)).toBeTruthy();
    expect(screen.getByText(landing.faq[0].answer)).toBeTruthy();
    expect(screen.getByText(landing.emptyTitle)).toBeTruthy();
    expect(
      document.querySelectorAll('script[type="application/ld+json"]').length,
    ).toBeGreaterThan(0);
  });
});
