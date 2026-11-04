import { ClipboardList, CreditCard, MessagesSquare, Truck } from "lucide-react";
import type { ReactNode } from "react";
import { steps } from "../content.ts";
import { Container, Reveal, SectionHeading } from "./ui.tsx";

const icons: ReactNode[] = [
  <ClipboardList className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />,
  <MessagesSquare className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />,
  <CreditCard className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />,
  <Truck className="h-5 w-5" strokeWidth={1.75} aria-hidden="true" />,
];

type ProcessProps = {
  onStart: () => void;
};

export function Process({ onStart }: ProcessProps) {
  return (
    <section id="process" className="py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            index="04"
            eyebrow="Как заказать"
            title="Четыре шага от заявки до выдачи"
            text="Цену фиксируем до выкупа. Вариант с разборки не оплачиваем, пока вы его не подтвердите."
          />
        </Reveal>

        <div className="relative mt-12 grid gap-8 md:grid-cols-4 md:gap-5">
          <div className="absolute top-6 right-[10%] left-[10%] hidden h-px bg-line md:block" aria-hidden="true" />
          {steps.map((step, index) => (
            <Reveal key={step.title} delay={index * 70}>
              <article className="relative">
                <div className="relative z-10 flex h-12 w-12 items-center justify-center border border-ember bg-ink font-display text-xl text-ember">
                  {index + 1}
                </div>
                <div className="mt-4 inline-flex items-center gap-2 text-ember">{icons[index]}</div>
                <h3 className="mt-3 text-lg font-semibold leading-snug">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-mist">{step.text}</p>
              </article>
            </Reveal>
          ))}
        </div>

        <div className="mt-10">
          <button type="button" className="btn btn-primary" onClick={onStart}>
            Оставить заявку
          </button>
        </div>
      </Container>
    </section>
  );
}
