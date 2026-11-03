"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { controlClassName, Field } from "@/components/ui/field";

const phoneSchema = z.object({
  phone: z.string().regex(/^\+375\d{9}$/, "Формат: +375 и 9 цифр, без пробелов"),
});

type PhoneValues = z.infer<typeof phoneSchema>;

export function PhoneFieldCheck() {
  const [isValid, setIsValid] = useState(false);
  const form = useForm<PhoneValues>({ defaultValues: { phone: "" } });
  const error = form.formState.errors.phone?.message;

  return (
    <form
      className="grid gap-4"
      noValidate
      onSubmit={form.handleSubmit((values) => {
        const parsed = phoneSchema.safeParse(values);
        if (!parsed.success) {
          form.setError("phone", {
            message: parsed.error.issues[0]?.message ?? "Проверьте номер",
          });
          setIsValid(false);
          return;
        }
        form.clearErrors("phone");
        setIsValid(true);
      })}
    >
      <Field
        error={error}
        hint="Проверка формата на этой странице. Заявка не создаётся и никуда не отправляется."
        htmlFor="sample-phone"
        label="Телефон"
      >
        <input
          aria-invalid={error ? true : undefined}
          autoComplete="tel"
          className={controlClassName}
          id="sample-phone"
          inputMode="tel"
          placeholder="+375291112233"
          {...form.register("phone")}
        />
      </Field>
      <Button type="submit" variant="primary">
        Проверить номер
      </Button>
      {isValid ? (
        <p className="text-sm text-success" role="status">
          Номер записан в верном формате. Это только проверка поля.
        </p>
      ) : null}
    </form>
  );
}
