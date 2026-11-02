import { useCallback, useRef, useState } from "react";
import { track } from "../lib/analytics.ts";
import { submitLead, type Lead } from "../lib/leads.ts";

type LeadInput = Omit<Lead, "createdAt">;

export function useSubmit() {
  const [status, setStatus] = useState<"idle" | "sending" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const lock = useRef(false);

  const reset = useCallback(() => {
    lock.current = false;
    setStatus("idle");
    setMessage("");
  }, []);

  const send = useCallback(async (lead: LeadInput, trap: string) => {
    if (lock.current) return;
    lock.current = true;
    setStatus("sending");
    setMessage("");

    try {
      await submitLead({ ...lead, createdAt: new Date().toISOString() }, trap);
      track("form_submit", { form: lead.kind });
      setStatus("done");
    } catch (error) {
      lock.current = false;
      setStatus("error");
      setMessage(error instanceof Error ? error.message : "Не удалось отправить заявку");
    }
  }, []);

  return { status, message, send, reset };
}
