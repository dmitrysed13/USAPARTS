import { ChevronDown } from "lucide-react";
import { useState } from "react";
import { faqs, reviews } from "../content.ts";
import { Container, Reveal, SectionHeading } from "./ui.tsx";

export function Trust() {
  const [openIndex, setOpenIndex] = useState(0);

  return (
    <section id="reviews" className="border-t border-line bg-asphalt py-16 sm:py-24">
      <Container>
        <Reveal>
          <SectionHeading
            index="05"
            eyebrow="Доверие"
            title="Сроки, возврат и опыт тех, кто уже заказывал"
            text="Коротко о доставке, б/у с аукционов и о том, как проходит оплата."
          />
        </Reveal>

        <div className="mt-10 grid items-start gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
          <div>
            <h3 className="font-display text-2xl tracking-wide">Частые вопросы</h3>
            <div className="mt-3 border-t border-line">
              {faqs.map((item, index) => {
                const open = openIndex === index;
                const panelId = `faq-panel-${index}`;
                const buttonId = `faq-button-${index}`;
                return (
                  <div key={item.question} className="border-b border-line">
                    <h4>
                      <button
                        id={buttonId}
                        type="button"
                        className="flex w-full items-center justify-between gap-4 py-4 text-left"
                        aria-expanded={open}
                        aria-controls={panelId}
                        onClick={() => setOpenIndex(open ? -1 : index)}
                      >
                        <span className="text-base font-semibold">{item.question}</span>
                        <ChevronDown
                          className={`h-5 w-5 shrink-0 text-ember transition-transform ${open ? "rotate-180" : ""}`}
                          strokeWidth={1.75}
                          aria-hidden="true"
                        />
                      </button>
                    </h4>
                    <div
                      id={panelId}
                      role="region"
                      aria-labelledby={buttonId}
                      aria-hidden={!open}
                      className={`grid transition-[grid-template-rows] duration-300 ${open ? "grid-rows-[1fr]" : "grid-rows-[0fr]"}`}
                    >
                      <div className="overflow-hidden">
                        <p className="pb-5 text-sm leading-relaxed text-mist">{item.answer}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div>
            <h3 className="font-display text-2xl tracking-wide">Отзывы</h3>
            <div className="mt-4 flex snap-x snap-mandatory gap-3 overflow-x-auto pb-2 lg:flex-col lg:overflow-visible">
              {reviews.map((review) => (
                <article key={review.caption} className="card w-[84%] shrink-0 snap-start p-5 lg:w-auto">
                  <p className="font-display text-5xl leading-none text-ember">“</p>
                  <p className="mt-2 text-sm leading-relaxed">{review.text}</p>
                  <p className="mt-4 text-sm font-semibold text-mist">{review.caption}</p>
                </article>
              ))}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
