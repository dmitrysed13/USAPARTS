import { ArrowRight, Check } from "lucide-react";
import { useEffect, useId, useRef, useState, type FormEvent } from "react";
import { brands, company, yearOptions } from "../content.ts";
import { useSubmit } from "../hooks/useSubmit.ts";
import { track } from "../lib/analytics.ts";
import { hasErrors, validateQuote, type FieldErrors, type PartCondition, type QuoteDraft, type QuoteSeed } from "../lib/validation.ts";
import { PhoneField } from "./PhoneField.tsx";
import { FieldError } from "./ui.tsx";

type QuoteFormProps = {
  seed: QuoteSeed;
  onDraft: (draft: QuoteDraft) => void;
  onPrivacy: () => void;
};

export function QuoteForm({ seed, onDraft, onPrivacy }: QuoteFormProps) {
  const [brand, setBrand] = useState("");
  const [model, setModel] = useState("");
  const [year, setYear] = useState("");
  const [part, setPart] = useState("");
  const [vin, setVin] = useState("");
  const [oem, setOem] = useState("");
  const [condition, setCondition] = useState<PartCondition>("");
  const [phone, setPhone] = useState("");
  const [trap, setTrap] = useState("");
  const started = useRef(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const { status, message, send, reset } = useSubmit();
  const successRef = useRef<HTMLHeadingElement>(null);
  const years = yearOptions();
  const baseId = useId();

  useEffect(() => {
    onDraft({ brand, model, year, part, vin, oem, condition, phone });
  }, [brand, condition, model, oem, onDraft, part, phone, vin, year]);

  useEffect(() => {
    if (seed.token === 0) return;
    if (seed.brand) setBrand(seed.brand);
    if (seed.model) setModel(seed.model);
    if (seed.year) setYear(seed.year);
    if (seed.part) setPart(seed.part);
    setErrors({});
    reset();
    const focusName = seed.focus ?? (seed.brand ? "part" : "brand");
    const timer = window.setTimeout(() => {
      document.querySelector<HTMLElement>(`#podbor [name='${focusName}']`)?.focus();
    }, 180);
    return () => window.clearTimeout(timer);
  }, [seed, reset]);

  useEffect(() => {
    if (status === "done" || status === "telegram") successRef.current?.focus();
  }, [status]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = validateQuote({ brand, model, year, part, vin, oem, condition, phone });
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    void send(
      {
        kind: "quote",
        phone,
        brand,
        model: model.trim(),
        year,
        part: part.trim(),
        vin: vin.trim().toUpperCase(),
        oem: oem.trim(),
        condition,
        name: "",
        time: "",
        comment: "",
      },
      trap,
    );
  };

  return (
    <div id="podbor" className="rounded-3xl border border-line bg-panel/95 p-4 shadow-[0_30px_80px_-40px_rgba(0,0,0,0.85)] sm:p-6 lg:p-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="eyebrow">Экспресс-подбор</p>
          <h2 className="mt-2 font-display text-3xl leading-none sm:text-4xl">Узнайте стоимость и наличие детали</h2>
        </div>
        <p className="max-w-xs text-sm leading-relaxed text-mist">Ответим в рабочее время, обычно в течение 10 минут.</p>
      </div>

      {status === "telegram" ? (
        <div className="mt-6 flex items-start gap-4 border border-line bg-ink/60 p-5" role="status" aria-live="polite">
          <span className="grid h-12 w-12 shrink-0 place-items-center bg-ember text-[#1a0c00]">
            <Check className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <div>
            <h3 ref={successRef} tabIndex={-1} className="font-display text-3xl leading-none outline-none">
              Откройте Telegram
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">
              Заявка собрана для @dmitry_spa. Если чат не открылся сам, нажмите кнопку и отправьте сообщение. Текст заявки уже в ссылке и в буфере обмена.
            </p>
            <a className="btn btn-primary mt-4" href={message} target="_blank" rel="noreferrer">
              Открыть чат @dmitry_spa
            </a>
          </div>
        </div>
      ) : status === "done" ? (
        <div className="mt-6 flex items-start gap-4 border border-line bg-ink/60 p-5" role="status" aria-live="polite">
          <span className="grid h-12 w-12 shrink-0 place-items-center bg-ember text-[#1a0c00]">
            <Check className="h-5 w-5" strokeWidth={2} aria-hidden="true" />
          </span>
          <div>
            <h3 ref={successRef} tabIndex={-1} className="font-display text-3xl leading-none outline-none">
              Заявка принята
            </h3>
            <p className="mt-2 max-w-xl text-sm leading-relaxed text-mist">
              Менеджер свяжется по номеру {phone}. Если удобнее переписка, напишите в Telegram или WhatsApp.
            </p>
            <button type="button" className="btn btn-ghost mt-4" onClick={reset}>
              Новая заявка
            </button>
          </div>
        </div>
      ) : (
        <form
          className="relative mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-12"
          onSubmit={onSubmit}
          noValidate
          onFocus={() => {
            if (started.current) return;
            started.current = true;
            track("form_start", { form: "quote" });
          }}
        >
          <div className="trap" aria-hidden="true">
            <label>
              Компания
              <input tabIndex={-1} autoComplete="off" value={trap} onChange={(event) => setTrap(event.target.value)} />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm sm:col-span-1 xl:col-span-3" htmlFor={`${baseId}-brand`}>
            <span className="text-mist">Марка авто</span>
            <span className="relative">
              <select
                id={`${baseId}-brand`}
                name="brand"
                className="field appearance-none pr-10"
                value={brand}
                aria-invalid={Boolean(errors.brand) || undefined}
                aria-describedby={errors.brand ? `${baseId}-brand-error` : undefined}
                onChange={(event) => setBrand(event.target.value)}
              >
                <option value="">Выберите марку</option>
                {brands.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-mist" aria-hidden="true">
                ▾
              </span>
            </span>
            <FieldError id={`${baseId}-brand-error`}>{errors.brand}</FieldError>
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-1 xl:col-span-2" htmlFor={`${baseId}-year`}>
            <span className="text-mist">Год выпуска</span>
            <span className="relative">
              <select
                id={`${baseId}-year`}
                name="year"
                className="field appearance-none pr-10"
                value={year}
                aria-invalid={Boolean(errors.year) || undefined}
                aria-describedby={errors.year ? `${baseId}-year-error` : undefined}
                onChange={(event) => setYear(event.target.value)}
              >
                <option value="">Год</option>
                {years.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
              <span className="pointer-events-none absolute top-1/2 right-3 -translate-y-1/2 text-mist" aria-hidden="true">
                ▾
              </span>
            </span>
            <FieldError id={`${baseId}-year-error`}>{errors.year}</FieldError>
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-1 xl:col-span-3" htmlFor={`${baseId}-model`}>
            <span className="text-mist">Модель</span>
            <input
              id={`${baseId}-model`}
              name="model"
              className="field"
              placeholder="Mustang, Tahoe"
              value={model}
              aria-invalid={Boolean(errors.model) || undefined}
              aria-describedby={errors.model ? `${baseId}-model-error` : undefined}
              onChange={(event) => setModel(event.target.value)}
            />
            <FieldError id={`${baseId}-model-error`}>{errors.model}</FieldError>
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-1 xl:col-span-4" htmlFor={`${baseId}-condition`}>
            <span className="text-mist">Тип детали</span>
            <select
              id={`${baseId}-condition`}
              name="condition"
              className="field"
              value={condition}
              onChange={(event) => setCondition(event.target.value as PartCondition)}
            >
              <option value="">Новая или б/у</option>
              <option value="Новая">Новая</option>
              <option value="Б/у">Б/у</option>
            </select>
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-2 xl:col-span-4" htmlFor={`${baseId}-part`}>
            <span className="text-mist">Название детали</span>
            <input
              id={`${baseId}-part`}
              name="part"
              className="field"
              placeholder="Капот, фара, двигатель"
              value={part}
              aria-invalid={Boolean(errors.part) || undefined}
              aria-describedby={errors.part ? `${baseId}-part-error` : undefined}
              onChange={(event) => setPart(event.target.value)}
            />
            <FieldError id={`${baseId}-part-error`}>{errors.part}</FieldError>
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-1 xl:col-span-4" htmlFor={`${baseId}-vin`}>
            <span className="text-mist">VIN</span>
            <input
              id={`${baseId}-vin`}
              name="vin"
              className="field uppercase"
              autoComplete="off"
              spellCheck={false}
              placeholder="17 знаков"
              value={vin}
              aria-invalid={Boolean(errors.vin) || undefined}
              aria-describedby={errors.vin ? `${baseId}-vin-error` : undefined}
              onChange={(event) => setVin(event.target.value)}
            />
            <FieldError id={`${baseId}-vin-error`}>{errors.vin}</FieldError>
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-1 xl:col-span-4" htmlFor={`${baseId}-oem`}>
            <span className="text-mist">OEM / артикул</span>
            <input
              id={`${baseId}-oem`}
              name="oem"
              className="field"
              placeholder="Если номер уже есть"
              value={oem}
              aria-invalid={Boolean(errors.oem) || undefined}
              aria-describedby={errors.oem ? `${baseId}-oem-error` : undefined}
              onChange={(event) => setOem(event.target.value)}
            />
            <FieldError id={`${baseId}-oem-error`}>{errors.oem}</FieldError>
          </label>

          <label className="grid gap-1.5 text-sm sm:col-span-2 xl:col-span-3" htmlFor={`${baseId}-phone`}>
            <span className="text-mist">Телефон для связи</span>
            <PhoneField
              id={`${baseId}-phone`}
              value={phone}
              onChange={setPhone}
              invalid={Boolean(errors.phone)}
              errorId={`${baseId}-phone-error`}
            />
            <FieldError id={`${baseId}-phone-error`}>{errors.phone}</FieldError>
          </label>

          <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between xl:col-span-12">
            <p className="text-xs leading-relaxed text-mist">
              Нажимая кнопку, вы соглашаетесь с{" "}
              <button type="button" className="link" onClick={onPrivacy}>
                политикой конфиденциальности
              </button>
              . Телефон обязателен.
            </p>
            <button type="submit" className="btn btn-primary w-full sm:w-auto" disabled={status === "sending"}>
              {status === "sending" ? "Отправляем" : "Узнать цену"}
              <ArrowRight className="h-4 w-4" strokeWidth={1.75} aria-hidden="true" />
            </button>
          </div>

          {status === "error" ? (
            <p role="alert" className="text-sm text-danger sm:col-span-2 xl:col-span-12">
              {message} Телефон: {company.phoneDisplay}.
            </p>
          ) : null}
        </form>
      )}
    </div>
  );
}
