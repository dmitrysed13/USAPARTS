import { z } from "zod";
import { assessVin } from "@/modules/vin/assess-vin";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .transform((value) => (value ? value : null));

export const vinRequestSchema = z
  .object({
    vin: z.string().trim().min(1, "Укажите VIN.").max(32, "VIN длиннее 32 символов."),
    vehicleBrand: optionalText(80),
    vehicleModel: optionalText(80),
    vehicleYear: z
      .union([z.string(), z.number(), z.null()])
      .optional()
      .transform((value) => {
        if (value === undefined || value === null || value === "") {
          return null;
        }
        const year = Number(value);
        if (!Number.isInteger(year) || year < 1950 || year > 2035) {
          return Number.NaN;
        }
        return year;
      }),
    engine: optionalText(80),
    partName: optionalText(160),
    partNumber: optionalText(80),
    customerName: z
      .string()
      .trim()
      .min(2, "Укажите имя, хотя бы 2 символа.")
      .max(120, "Имя слишком длинное."),
    phone: z
      .string()
      .trim()
      .max(32)
      .optional()
      .transform((value) => (value ? value : null)),
    email: z
      .string()
      .trim()
      .max(160)
      .optional()
      .transform((value) => (value ? value : null)),
    comment: optionalText(2000),
    consent: z.boolean(),
    website: z
      .string()
      .optional()
      .transform((value) => value ?? ""),
  })
  .superRefine((value, context) => {
    if (value.website.trim()) {
      context.addIssue({
        code: "custom",
        path: ["website"],
        message: "Заявка не принята.",
      });
    }
    if (!value.consent) {
      context.addIssue({
        code: "custom",
        path: ["consent"],
        message: "Нужно согласие на сохранение контакта.",
      });
    }
    if (!value.phone && !value.email) {
      context.addIssue({
        code: "custom",
        path: ["phone"],
        message: "Укажите телефон или email.",
      });
    }
    if (value.phone && value.phone.replace(/\D/g, "").length < 7) {
      context.addIssue({
        code: "custom",
        path: ["phone"],
        message: "В телефоне должно быть не меньше 7 цифр.",
      });
    }
    if (value.email && !z.email().safeParse(value.email).success) {
      context.addIssue({ code: "custom", path: ["email"], message: "Проверьте email." });
    }
    if (Number.isNaN(value.vehicleYear)) {
      context.addIssue({
        code: "custom",
        path: ["vehicleYear"],
        message: "Год укажите числом от 1950 до 2035.",
      });
    }
    const vin = assessVin(value.vin);
    if (!vin.ok) {
      context.addIssue({ code: "custom", path: ["vin"], message: vin.message });
    }
  });

export type VinRequestInput = z.infer<typeof vinRequestSchema>;
