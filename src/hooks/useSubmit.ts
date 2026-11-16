import { useCallback, useRef, useState } from "react";
import { track } from "../lib/analytics.ts";
import { MailHandoff, submitLead, type Lead } from "../lib/leads.ts";

type LeadInput = Omit<Lead, "createdAt">;

export function useSubmit() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "mail" | "error">("idle");
  const [message, setMessage] = useState("");
  const [mailto, setMailto] = useState("");
  const lock = useRef(false);

  const reset = useCallback(() => {
    lock.current = false;
    setStatus("idle");
    setMessage("");
    setMailto("");
  }, []);

  const send = useCallback(async (lead: LeadInput, trap: string) => {
    if (lock.current) return;
    lock.current = true;
    setStatus("sending");
    setMessage("");
    setMailto("");

    try {
      await submitLead({ ...lead, createdAt: new Date().toISOString() }, trap);
      track("form_submit", { form: lead.kind });
      setStatus("done");
    } catch (error) {
      if (error instanceof MailHandoff) {
        void navigator.clipboard?.writeText(error.text).catch(() => undefined);
        if (typeof window !== "undefined") window.location.href = error.href;
        track("form_submit", { form: lead.kind });
        setStatus("mail");
        setMessage(error.gmail);
        setMailto(error.href);
        return;
      }
      lock.current = false;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Не удалось отправить заявку");
    }
  }, []);

  return { status, message, mailto, send, reset };
}
