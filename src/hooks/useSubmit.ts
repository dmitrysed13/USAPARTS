import { useCallback, useRef, useState } from "react";
import { track } from "../lib/analytics.ts";
import { submitLead, TelegramHandoff, type Lead } from "../lib/leads.ts";

type LeadInput = Omit<Lead, "createdAt">;

function reserveTelegramWindow(): Window | null {
  if (typeof window === "undefined") return null;
  return window.open("about:blank", "_blank");
}

function revealTelegram(popup: Window | null, href: string) {
  if (popup && !popup.closed) {
    popup.location.href = href;
    popup.opener = null;
    return;
  }
  if (typeof window !== "undefined") window.location.assign(href);
}

export function useSubmit() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "telegram" | "error">("idle");
  const [message, setMessage] = useState("");
  const lock = useRef(false);

  const reset = useCallback(() => {
    lock.current = false;
    setStatus("idle");
    setMessage("");
  }, []);

  const send = useCallback(async (lead: LeadInput, trap: string) => {
    if (lock.current) return;
    const popup = reserveTelegramWindow();
    lock.current = true;
    setStatus("sending");
    setMessage("");

    try {
      await submitLead({ ...lead, createdAt: new Date().toISOString() }, trap);
      popup?.close();
      track("form_submit", { form: lead.kind });
      setStatus("done");
    } catch (error) {
      if (error instanceof TelegramHandoff) {
        void navigator.clipboard?.writeText(error.text).catch(() => undefined);
        revealTelegram(popup, error.href);
        track("form_submit", { form: lead.kind });
        setStatus("telegram");
        setMessage(error.href);
        return;
      }
      popup?.close();
      lock.current = false;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Не удалось отправить заявку");
    }
  }, []);

  return { status, message, send, reset };
}
