import { useEffect, useRef, type ReactNode } from "react";
import { createPortal } from "react-dom";
import { X } from "lucide-react";

const FOCUSABLE = "a[href], button:not([disabled]), textarea, input, select, [tabindex]:not([tabindex='-1'])";

type DialogProps = {
  title: string;
  titleId: string;
  onClose: () => void;
  children: ReactNode;
  zClass?: string;
};

export function Dialog({ title, titleId, onClose, children, zClass = "z-[70]" }: DialogProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const panel = panelRef.current;
    const previouslyFocused = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    const preferred =
      panel?.querySelector<HTMLElement>("[data-autofocus]") ??
      panel?.querySelector<HTMLElement>("input, select, textarea");
    (preferred ?? panel)?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      const dialogs = document.querySelectorAll<HTMLElement>("[role='dialog']");
      const top = dialogs[dialogs.length - 1];
      if (!panel || top !== panel) return;

      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const items = [...panel.querySelectorAll<HTMLElement>(FOCUSABLE)].filter((item) => item.tabIndex !== -1);
      if (items.length === 0) {
        event.preventDefault();
        return;
      }

      const first = items[0];
      const last = items[items.length - 1];
      if (!first || !last) return;

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      if (!document.querySelector("[role='dialog']")) document.body.style.overflow = previousOverflow;
      previouslyFocused?.focus();
    };
  }, [onClose]);

  return createPortal(
    <div className={`fixed inset-0 ${zClass} flex items-end justify-center sm:items-center sm:p-6`}>
      <div className="absolute inset-0 bg-black/75 backdrop-blur-[2px]" onClick={onClose} />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className="relative flex max-h-[min(92svh,860px)] w-full flex-col overflow-hidden rounded-t-3xl border border-line bg-asphalt shadow-[0_30px_80px_-30px_rgba(0,0,0,0.85)] outline-none sm:max-w-lg sm:rounded-3xl"
      >
        <div className="flex items-start justify-between gap-4 border-b border-line px-5 py-4">
          <h2 id={titleId} className="font-display text-3xl leading-none">
            {title}
          </h2>
          <button type="button" className="icon-btn shrink-0" onClick={onClose} aria-label="Закрыть окно">
            <X className="h-4 w-4" strokeWidth={1.75} />
          </button>
        </div>
        <div className="overflow-y-auto px-5 py-5">{children}</div>
      </div>
    </div>,
    document.body,
  );
}
