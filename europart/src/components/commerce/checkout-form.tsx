"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { buttonClassName } from "@/components/ui/button";
import { Field, controlClassName } from "@/components/ui/field";

export type CheckoutDeliveryOption = {
  methodId: string;
  name: string;
  requiresAddress: boolean;
  chargedCents: number;
  costPendingManager: boolean;
  message: string;
};

export function CheckoutForm({
  deliveryMethods,
  onlineAvailable,
  onlineMessage,
  subtotalCents,
}: {
  deliveryMethods: CheckoutDeliveryOption[];
  onlineAvailable: boolean;
  onlineMessage: string;
  subtotalCents: number | null;
}) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [methodId, setMethodId] = useState(deliveryMethods[0]?.methodId ?? "");
  const [mode, setMode] = useState<"MANAGER" | "ONLINE">("MANAGER");
  const selected = useMemo(
    () => deliveryMethods.find((method) => method.methodId === methodId) ?? null,
    [deliveryMethods, methodId],
  );

  if (deliveryMethods.length === 0) {
    return (
      <p className="text-sm text-ink-muted">
        Способы доставки ещё не настроены. Менеджер может добавить их через admin API.
        Оформление заказа временно недоступно.
      </p>
    );
  }

  return (
    <form
      className="grid gap-4"
      onSubmit={(event) => {
        event.preventDefault();
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          setError(null);
          const response = await fetch("/api/checkout", {
            method: "POST",
            headers: { "content-type": "application/json" },
            body: JSON.stringify({
              name: String(form.get("name") ?? ""),
              phone: String(form.get("phone") ?? ""),
              email: String(form.get("email") ?? ""),
              city: String(form.get("city") ?? ""),
              address: String(form.get("address") ?? ""),
              comment: String(form.get("comment") ?? ""),
              deliveryMethodId: methodId,
              checkoutMode: mode,
            }),
          });
          const data = (await response.json()) as {
            message?: string;
            accessToken?: string;
          };
          if (!response.ok || !data.accessToken) {
            setError(data.message ?? "Заказ не создан.");
            return;
          }
          router.push(`/order/${data.accessToken}`);
        });
      }}
    >
      <Field htmlFor="name" label="Имя">
        <input className={controlClassName} id="name" name="name" required />
      </Field>
      <Field htmlFor="phone" label="Телефон">
        <input className={controlClassName} id="phone" name="phone" required />
      </Field>
      <Field htmlFor="email" label="Email">
        <input className={controlClassName} id="email" name="email" type="email" />
      </Field>
      <Field htmlFor="city" label="Город">
        <input className={controlClassName} id="city" name="city" />
      </Field>
      <label className="grid gap-1 text-sm">
        <span className="font-medium">Способ доставки</span>
        <select
          className={controlClassName}
          onChange={(event) => setMethodId(event.target.value)}
          value={methodId}
        >
          {deliveryMethods.map((method) => (
            <option key={method.methodId} value={method.methodId}>
              {method.name}
            </option>
          ))}
        </select>
        {selected ? <span className="text-ink-muted">{selected.message}</span> : null}
      </label>
      <Field
        htmlFor="address"
        label={selected?.requiresAddress ? "Адрес" : "Адрес (если нужен)"}
      >
        <input
          className={controlClassName}
          id="address"
          name="address"
          required={Boolean(selected?.requiresAddress)}
        />
      </Field>
      <Field htmlFor="comment" label="Комментарий">
        <textarea
          className="min-h-24 w-full rounded-control border border-line bg-surface px-3 py-2"
          id="comment"
          name="comment"
        />
      </Field>
      <fieldset className="grid gap-2 text-sm">
        <legend className="font-medium">Оплата</legend>
        <label className="flex items-start gap-2">
          <input
            checked={mode === "MANAGER"}
            name="checkoutMode"
            onChange={() => setMode("MANAGER")}
            type="radio"
            value="MANAGER"
          />
          <span>
            Через менеджера — заказ сохранится, менеджер подтвердит оплату и доставку.
          </span>
        </label>
        <label className="flex items-start gap-2">
          <input
            checked={mode === "ONLINE"}
            disabled={!onlineAvailable}
            name="checkoutMode"
            onChange={() => setMode("ONLINE")}
            type="radio"
            value="ONLINE"
          />
          <span>
            Онлайн-оплата
            {!onlineAvailable ? ` — недоступна. ${onlineMessage}` : ` — ${onlineMessage}`}
          </span>
        </label>
      </fieldset>
      {subtotalCents != null ? (
        <p className="text-sm">
          Товары: {(subtotalCents / 100).toFixed(2)} BYN
          {selected
            ? ` · доставка сейчас: ${(selected.chargedCents / 100).toFixed(2)} BYN`
            : null}
        </p>
      ) : null}
      {error ? (
        <p className="text-sm text-danger" role="alert">
          {error}
        </p>
      ) : null}
      <button className={buttonClassName("primary")} disabled={pending} type="submit">
        {pending ? "Оформляем…" : "Оформить заказ"}
      </button>
    </form>
  );
}
