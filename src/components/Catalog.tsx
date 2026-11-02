import { CarFront, Cog, Disc3, Lightbulb, Wrench } from "lucide-react";
import type { ReactNode } from "react";
import { categories, featuredBrands } from "../content.ts";
import { Container, Reveal, SectionHeading } from "./ui.tsx";

function ChassisIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-6 w-6" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="6.5" cy="16.5" r="2.25" />
      <circle cx="17.5" cy="16.5" r="2.25" />
      <path d="M8.7 16.5h6.6M6.5 16.5 8.2 10h7.6l1.7 6.5M9.2 10l1-3h3.6l1 3" />
    </svg>
  );
}

const icons: Record<(typeof categories)[number]["id"], ReactNode> = {
  engine: <Cog className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />,
  chassis: <ChassisIcon />,
  brakes: <Disc3 className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />,
  body: <CarFront className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />,
  electric: <Lightbulb className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />,
  service: <Wrench className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />,
};

type CatalogProps = {
  onBrand: (brand: string) => void;
  onCategory: (part: string) => void;
};

export function Catalog({ onBrand, onCategory }: CatalogProps) {
  return (
    <section id="catalog" className="py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            index="02"
            eyebrow="Каталог"
            title="Марки и узлы, которые привозим чаще всего"
            text="Выберите марку или категорию — форма подбора откроется с уже заполненным полем."
          />
        </Reveal>

        <div className="mt-10 grid grid-cols-2 gap-3 md:grid-cols-3">
          {featuredBrands.map((brand, index) => (
            <Reveal key={brand.name} delay={index * 50} className="h-full">
              <button
                type="button"
                className="card flex h-full w-full flex-col items-start px-4 py-5 text-left sm:px-5 sm:py-6"
                onClick={() => onBrand(brand.name)}
              >
                <span className="text-[11px] tracking-[0.16em] text-mist uppercase">0{index + 1}</span>
                <span className="mt-3 font-display text-3xl leading-none sm:text-4xl">{brand.name}</span>
                <span className="mt-3 text-sm leading-relaxed text-mist">{brand.models}</span>
                <span className="mt-4 text-sm font-semibold text-ember">Подобрать</span>
              </button>
            </Reveal>
          ))}
        </div>

        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {categories.map((category, index) => (
            <Reveal key={category.id} delay={index * 40} className="h-full">
              <button
                type="button"
                className="card flex h-full w-full items-start gap-4 px-4 py-5 text-left sm:px-5"
                onClick={() => onCategory(category.part)}
              >
                <span className="grid h-12 w-12 shrink-0 place-items-center bg-ember/12 text-ember">{icons[category.id]}</span>
                <span>
                  <span className="block text-base font-semibold">{category.title}</span>
                  <span className="mt-1 block text-sm leading-relaxed text-mist">{category.text}</span>
                </span>
              </button>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
