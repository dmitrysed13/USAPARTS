"use client";

import { useState, useTransition } from "react";
import { buttonClassName } from "@/components/ui/button";

export function AddToCartButton({
  offerId,
  disabledReason,
}: {
  offerId: string | null;
  disabledReason?: string | null;
}) {
  const [message, setMessage] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  if (!offerId) {
    return (
      <p className="text-sm text-ink-muted">
        {disabledReason ?? "В корзину можно добавить только предложение с розничной ценой."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-2">
      <button
        className={buttonClassName("primary")}
        disabled={pending}
        onClick={() => {
          startTransition(async () => {
            setMessage(null);
            const response = await fetch("/api/cart", {
              method: "POST",
              headers: { "content-type": "application/json" },
              body: JSON.stringify({ offerId, quantity: 1 }),
            });
            const data = (await response.json()) as { message?: string };
            if (!response.ok) {
              setMessage(data.message ?? "Не удалось добавить в корзину.");
              return;
            }
            setMessage("Добавлено в корзину.");
          });
        }}
        type="button"
      >
        {pending ? "Добавляем…" : "В корзину"}
      </button>
      {message ? <p className="text-sm text-ink-muted">{message}</p> : null}
    </div>
  );
}
