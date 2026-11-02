import { useCallback, useRef, useState } from "react";
import { Benefits } from "./components/Benefits.tsx";
import { Catalog } from "./components/Catalog.tsx";
import { Footer } from "./components/Footer.tsx";
import { Header } from "./components/Header.tsx";
import { Hero } from "./components/Hero.tsx";
import { LeadModal } from "./components/LeadModal.tsx";
import { SideMessengers } from "./components/Messengers.tsx";
import { MobileDock } from "./components/MobileDock.tsx";
import { PrivacyDialog } from "./components/PrivacyDialog.tsx";
import { Process } from "./components/Process.tsx";
import { QuoteForm } from "./components/QuoteForm.tsx";
import { Trust } from "./components/Trust.tsx";
import { Container } from "./components/ui.tsx";
import type { QuoteDraft, QuoteSeed } from "./lib/validation.ts";

type ModalKind = "callback" | "quote" | null;

const emptyDraft: QuoteDraft = { brand: "", year: "", part: "", phone: "" };

export default function App() {
  const [modal, setModal] = useState<ModalKind>(null);
  const [privacyOpen, setPrivacyOpen] = useState(false);
  const [seed, setSeed] = useState<QuoteSeed>({ token: 0, brand: "", part: "" });
  const draftRef = useRef<QuoteDraft>(emptyDraft);

  const onDraft = useCallback((draft: QuoteDraft) => {
    draftRef.current = draft;
  }, []);

  const closeModal = useCallback(() => setModal(null), []);
  const closePrivacy = useCallback(() => setPrivacyOpen(false), []);
  const openPrivacy = useCallback(() => setPrivacyOpen(true), []);
  const openCallback = useCallback(() => setModal("callback"), []);
  const openQuote = useCallback(() => setModal("quote"), []);

  const goToQuote = useCallback((partial?: { brand?: string; part?: string }) => {
    const next = {
      token: Date.now(),
      brand: partial?.brand ?? "",
      part: partial?.part ?? "",
    };
    setSeed(next);
    document.getElementById("podbor")?.scrollIntoView({ behavior: "smooth", block: "center" });
  }, []);

  return (
    <>
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-[90] focus:bg-ember focus:px-4 focus:py-2 focus:text-[#1a0c00]"
      >
        К содержанию
      </a>
      <Header onCallback={openCallback} />
      <main id="main" className="max-sm:pr-16">
        <div id="top" className="hero-shell relative overflow-hidden">
          <div className="hero-grid pointer-events-none absolute inset-0" aria-hidden="true" />
          <div className="relative">
            <Hero onPick={() => goToQuote()} onCalculate={openQuote} />
            <Container className="relative pb-24 lg:pb-20">
              <QuoteForm seed={seed} onDraft={onDraft} onPrivacy={openPrivacy} />
            </Container>
          </div>
        </div>
        <Catalog onBrand={(brand) => goToQuote({ brand })} onCategory={(part) => goToQuote({ part })} />
        <Benefits />
        <Process onStart={() => goToQuote()} />
        <Trust />
      </main>
      <Footer onPrivacy={openPrivacy} />
      <SideMessengers />
      {modal ? null : <MobileDock onPick={() => goToQuote()} onCallback={openCallback} />}
      {modal ? (
        <LeadModal
          key={modal}
          kind={modal}
          initial={modal === "quote" ? draftRef.current : undefined}
          onClose={closeModal}
          onPrivacy={openPrivacy}
        />
      ) : null}
      {privacyOpen ? <PrivacyDialog onClose={closePrivacy} /> : null}
    </>
  );
}
