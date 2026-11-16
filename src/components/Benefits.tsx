import { FileCheck, Plane, ScanSearch, ShieldCheck } from "lucide-react";
import type { ReactNode } from "react";
import { benefits } from "../content.ts";
import { Container, Reveal, SectionHeading } from "./ui.tsx";

const icons: Record<(typeof benefits)[number]["icon"], ReactNode> = {
  shield: <ShieldCheck className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />,
  plane: <Plane className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />,
  scan: <ScanSearch className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />,
  file: <FileCheck className="h-6 w-6" strokeWidth={1.75} aria-hidden="true" />,
};

export function Benefits() {
  return (
    <section id="benefits" className="border-y border-line bg-asphalt py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            index="03"
            eyebrow="Преимущества"
            title="Почему выбирают USAPARTS"
            text="Прямой выкуп в США, понятная цена до оплаты и деталь, которую сверили с VIN."
          />
        </Reveal>
        <div className="mt-10 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {benefits.map((benefit, index) => (
            <Reveal key={benefit.title} delay={index * 60} className="h-full">
              <article className="card h-full p-5 sm:p-6">
                <div className="flex items-center justify-between">
                  <span className="grid h-12 w-12 place-items-center bg-ember text-[#1a0c00]">{icons[benefit.icon]}</span>
                  <span className="font-display text-2xl text-mist/70">0{index + 1}</span>
                </div>
                <h3 className="mt-6 font-display text-3xl leading-none">{benefit.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mist">{benefit.text}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </Container>
    </section>
  );
}
