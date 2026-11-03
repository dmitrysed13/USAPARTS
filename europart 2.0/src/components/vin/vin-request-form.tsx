"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { buttonClassName } from "@/components/ui/button";
import { controlClassName, Field } from "@/components/ui/field";

type VinFormValues = {
  vin: string;
  vehicleBrand: string;
  vehicleModel: string;
  vehicleYear: string;
  engine: string;
  partName: string;
  partNumber: string;
  customerName: string;
  phone: string;
  email: string;
  comment: string;
  consent: boolean;
  website: string;
};

type FieldErrors = Record<string, string[] | undefined>;

const fields: Array<{ name: keyof VinFormValues; label: string; hint?: string }> = [
  { name: "vehicleBrand", label: "Марка автомобиля" },
  { name: "vehicleModel", label: "Модель" },
  { name: "vehicleYear", label: "Год", hint: "От 1950 до 2035, если известен." },
  { name: "engine", label: "Двигатель" },
  { name: "partName", label: "Название запчасти" },
  { name: "partNumber", label: "OEM или артикул" },
];

export function VinRequestForm({
  defaults,
}: {
  defaults?: { partName?: string; partNumber?: string };
}) {
  const [formError, setFormError] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    message: string;
    notice: string | null;
  } | null>(null);
  const form = useForm<VinFormValues>({
    defaultValues: {
      vin: "",
      vehicleBrand: "",
      vehicleModel: "",
      vehicleYear: "",
      engine: "",
      partName: defaults?.partName ?? "",
      partNumber: defaults?.partNumber ?? "",
      customerName: "",
      phone: "",
      email: "",
      comment: "",
      consent: false,
      website: "",
    },
  });

  async function onSubmit(values: VinFormValues) {
    setFormError(null);
    const response = await fetch("/api/vin-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(values),
    });
    const body = (await response.json().catch(() => null)) as {
      message?: string;
      fieldErrors?: FieldErrors;
      vinNotice?: string | null;
    } | null;

    if (response.status === 201 && body?.message) {
      setSuccess({ message: body.message, notice: body.vinNotice ?? null });
      return;
    }

    form.clearErrors();
    for (const [key, messages] of Object.entries(body?.fieldErrors ?? {})) {
      const message = messages?.[0];
      if (message && key in values) {
        form.setError(key as keyof VinFormValues, { message });
      }
    }
    setFormError(body?.message ?? "Заявку не удалось отправить. Повторите ещё раз.");
  }

  if (success) {
    return (
      <div className="rounded-2xl border border-line bg-surface-muted p-6" role="status">
        <h2 className="font-display text-2xl font-semibold">Заявка сохранена</h2>
        <p className="mt-3 leading-7">{success.message}</p>
        {success.notice ? (
          <p className="mt-3 text-sm leading-6 text-ink-muted">{success.notice}</p>
        ) : null}
      </div>
    );
  }

  const errors = form.formState.errors;
  const pending = form.formState.isSubmitting;

  return (
    <form
      autoComplete="off"
      className="grid gap-5"
      noValidate
      onSubmit={form.handleSubmit(onSubmit)}
    >
      <Field error={errors.vin?.message} htmlFor="vin" label="VIN">
        <input
          className={controlClassName}
          id="vin"
          {...form.register("vin")}
          autoComplete="off"
          aria-invalid={errors.vin ? true : undefined}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        {fields.map((field) => (
          <Field
            error={errors[field.name]?.message}
            hint={field.hint}
            htmlFor={field.name}
            key={field.name}
            label={field.label}
          >
            <input
              className={controlClassName}
              id={field.name}
              {...form.register(field.name)}
              aria-invalid={errors[field.name] ? true : undefined}
              inputMode={field.name === "vehicleYear" ? "numeric" : undefined}
            />
          </Field>
        ))}
      </div>
      <Field error={errors.customerName?.message} htmlFor="customerName" label="Имя">
        <input
          autoComplete="name"
          className={controlClassName}
          id="customerName"
          {...form.register("customerName")}
          aria-invalid={errors.customerName ? true : undefined}
        />
      </Field>
      <div className="grid gap-5 sm:grid-cols-2">
        <Field
          error={errors.phone?.message}
          hint="Телефон или email — хотя бы одно поле."
          htmlFor="phone"
          label="Телефон"
        >
          <input
            autoComplete="tel"
            className={controlClassName}
            id="phone"
            {...form.register("phone")}
            aria-invalid={errors.phone ? true : undefined}
          />
        </Field>
        <Field error={errors.email?.message} htmlFor="email" label="Email">
          <input
            autoComplete="email"
            className={controlClassName}
            id="email"
            type="email"
            {...form.register("email")}
            aria-invalid={errors.email ? true : undefined}
          />
        </Field>
      </div>
      <Field error={errors.comment?.message} htmlFor="comment" label="Комментарий">
        <textarea
          className={`${controlClassName} h-32 py-3`}
          id="comment"
          {...form.register("comment")}
        />
      </Field>
      <div
        className="absolute left-[-9999px] h-px w-px overflow-hidden"
        aria-hidden="true"
      >
        <input
          autoComplete="off"
          tabIndex={-1}
          {...form.register("website")}
          id="hp-field"
          name="hp-field"
        />
      </div>
      <label className="flex items-start gap-3 text-sm leading-6">
        <input className="mt-1 size-4" type="checkbox" {...form.register("consent")} />
        <span>
          Согласен на сохранение VIN и контакта для ответа по этой заявке. Текст политики
          ещё готовит юрист, состав данных описан на странице{" "}
          <Link className="font-semibold text-brand" href="/privacy">
            обработки данных
          </Link>
          .
        </span>
      </label>
      {errors.consent?.message ? (
        <p className="text-sm text-danger" role="alert">
          {errors.consent.message}
        </p>
      ) : null}
      {formError ? (
        <p className="text-sm text-danger" role="alert">
          {formError}
        </p>
      ) : null}
      <button className={buttonClassName("primary")} disabled={pending} type="submit">
        {pending ? "Сохраняем…" : "Отправить заявку"}
      </button>
    </form>
  );
}
