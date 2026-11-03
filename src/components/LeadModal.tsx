import { Check } from "lucide-react";
import { useEffect, useRef, useState, type FormEvent } from "react";
import { brands, callTimes, company, yearOptions } from "../content.ts";
import { useSubmit } from "../hooks/useSubmit.ts";
import { track } from "../lib/analytics.ts";
import { hasErrors, validateCallback, validateQuote, type PartCondition, type QuoteDraft } from "../lib/validation.ts";
import { Dialog } from "./Dialog.tsx";
import { PhoneField } from "./PhoneField.tsx";
import { FieldError } from "./ui.tsx";

type LeadModalProps = {
  kind: "callback" | "quote";
  initial?: QuoteDraft;
  onClose: () => void;
  onPrivacy: () => void;
};

export function LeadModal({ kind, initial, onClose, onPrivacy }: LeadModalProps) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState(initial?.phone ?? "");
  const [brand, setBrand] = useState(initial?.brand ?? "");
  const [model, setModel] = useState(initial?.model ?? "");
  const [year, setYear] = useState(initial?.year ?? "");
  const [part, setPart] = useState(initial?.part ?? "");
  const [vin, setVin] = useState(initial?.vin ?? "");
  const [oem, setOem] = useState(initial?.oem ?? "");
  const [condition, setCondition] = useState<PartCondition>(initial?.condition ?? "");
  const [time, setTime] = useState<string>(callTimes[0]);
  const [comment, setComment] = useState("");
  const [trap, setTrap] = useState("");
  const started = useRef(false);
  const [errors, setErrors] = useState<ReturnType<typeof validateQuote>>({});
  const { status, message, send } = useSubmit();
  const successRef = useRef<HTMLHeadingElement>(null);
  const years = yearOptions();
  const isQuote = kind === "quote";

  useEffect(() => {
    if (status === "done") successRef.current?.focus();
  }, [status]);

  const onSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors = isQuote ? validateQuote({ brand, model, year, part, vin, oem, condition, phone }) : validateCallback(phone);
    setErrors(nextErrors);
    if (hasErrors(nextErrors)) return;

    void send(
      {
        kind,
        phone,
        brand: isQuote ? brand : "",
        model: isQuote ? model.trim() : "",
        year: isQuote ? year : "",
        part: isQuote ? part.trim() : "",
        vin: isQuote ? vin.trim().toUpperCase() : "",
        oem: isQuote ? oem.trim() : "",
        condition: isQuote ? condition : "",
        name: name.trim(),
        time: isQuote ? "" : time,
        comment: comment.trim(),
      },
      trap,
    );
  };

  return (
    <Dialog title={isQuote ? "Рассчитать стоимость" : "Заказать звонок"} titleId="lead-title" onClose={onClose}>
      {status === "done" ? (
        <div role="status" aria-live="polite">
          <span className="grid h-12 w-12 place-items-center bg-ember text-[#1a0c00]">
            <Check className="h-5 w-5" aria-hidden="true" />
          </span>
          <h3 ref={successRef} tabIndex={-1} className="mt-4 font-display text-3xl leading-none outline-none">
            Заявка принята
          </h3>
          <p className="mt-3 text-sm leading-relaxed text-mist">
            {isQuote
              ? `Посчитаем наличие и цену и свяжемся по номеру ${phone}.`
              : `Перезвоним на ${phone}. Если указали время, учтём его.`}
          </p>
          <button type="button" className="btn btn-primary mt-5" onClick={onClose}>
            Закрыть
          </button>
        </div>
      ) : (
        <form
          className="relative grid gap-3"
          onSubmit={onSubmit}
          noValidate
          onFocus={() => {
            if (started.current) return;
            started.current = true;
            track("form_start", { form: isQuote ? "quote" : "callback" });
          }}
        >
          <div className="trap" aria-hidden="true">
            <label>
              Компания
              <input tabIndex={-1} autoComplete="off" value={trap} onChange={(event) => setTrap(event.target.value)} />
            </label>
          </div>

          <label className="grid gap-1.5 text-sm" htmlFor="modal-name">
            <span className="text-mist">Имя</span>
            <input
              id="modal-name"
              name="name"
              className="field"
              autoComplete="name"
              placeholder="Как к вам обращаться"
              value={name}
              onChange={(event) => setName(event.target.value)}
            />
          </label>

          {isQuote ? (
            <>
              <label className="grid gap-1.5 text-sm" htmlFor="modal-brand">
                <span className="text-mist">Марка авто</span>
                <select
                  id="modal-brand"
                  className="field"
                  data-autofocus=""
                  value={brand}
                  aria-invalid={Boolean(errors.brand) || undefined}
                  aria-describedby={errors.brand ? "modal-brand-error" : undefined}
                  onChange={(event) => setBrand(event.target.value)}
                >
                  <option value="">Выберите марку</option>
                  {brands.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <FieldError id="modal-brand-error">{errors.brand}</FieldError>
              </label>
              <label className="grid gap-1.5 text-sm" htmlFor="modal-year">
                <span className="text-mist">Год выпуска</span>
                <select
                  id="modal-year"
                  className="field"
                  value={year}
                  aria-invalid={Boolean(errors.year) || undefined}
                  aria-describedby={errors.year ? "modal-year-error" : undefined}
                  onChange={(event) => setYear(event.target.value)}
                >
                  <option value="">Год</option>
                  {years.map((item) => (
                    <option key={item} value={item}>
                      {item}
                    </option>
                  ))}
                </select>
                <FieldError id="modal-year-error">{errors.year}</FieldError>
              </label>
              <label className="grid gap-1.5 text-sm" htmlFor="modal-model">
                <span className="text-mist">Модель</span>
                <input
                  id="modal-model"
                  className="field"
                  value={model}
                  placeholder="Mustang, Tahoe"
                  aria-invalid={Boolean(errors.model) || undefined}
                  aria-describedby={errors.model ? "modal-model-error" : undefined}
                  onChange={(event) => setModel(event.target.value)}
                />
                <FieldError id="modal-model-error">{errors.model}</FieldError>
              </label>
              <label className="grid gap-1.5 text-sm" htmlFor="modal-part">
                <span className="text-mist">Название детали</span>
                <input
                  id="modal-part"
                  className="field"
                  value={part}
                  placeholder="Капот, фара, двигатель"
                  aria-invalid={Boolean(errors.part) || undefined}
                  aria-describedby={errors.part ? "modal-part-error" : undefined}
                  onChange={(event) => setPart(event.target.value)}
                />
                <FieldError id="modal-part-error">{errors.part}</FieldError>
              </label>
              <label className="grid gap-1.5 text-sm" htmlFor="modal-vin">
                <span className="text-mist">VIN</span>
                <input
                  id="modal-vin"
                  className="field uppercase"
                  value={vin}
                  autoComplete="off"
                  spellCheck={false}
                  placeholder="17 знаков"
                  aria-invalid={Boolean(errors.vin) || undefined}
                  aria-describedby={errors.vin ? "modal-vin-error" : undefined}
                  onChange={(event) => setVin(event.target.value)}
                />
                <FieldError id="modal-vin-error">{errors.vin}</FieldError>
              </label>
              <label className="grid gap-1.5 text-sm" htmlFor="modal-oem">
                <span className="text-mist">OEM / артикул</span>
                <input
                  id="modal-oem"
                  className="field"
                  value={oem}
                  placeholder="Если номер уже есть"
                  aria-invalid={Boolean(errors.oem) || undefined}
                  aria-describedby={errors.oem ? "modal-oem-error" : undefined}
                  onChange={(event) => setOem(event.target.value)}
                />
                <FieldError id="modal-oem-error">{errors.oem}</FieldError>
              </label>
              <label className="grid gap-1.5 text-sm" htmlFor="modal-condition">
                <span className="text-mist">Тип детали</span>
                <select
                  id="modal-condition"
                  className="field"
                  value={condition}
                  onChange={(event) => setCondition(event.target.value as PartCondition)}
                >
                  <option value="">Новая или б/у</option>
                  <option value="Новая">Новая</option>
                  <option value="Б/у">Б/у</option>
                </select>
              </label>
            </>
          ) : (
            <label className="grid gap-1.5 text-sm" htmlFor="modal-time">
              <span className="text-mist">Удобное время</span>
              <select id="modal-time" className="field" value={time} onChange={(event) => setTime(event.target.value)}>
                {callTimes.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
          )}

          <label className="grid gap-1.5 text-sm" htmlFor="modal-phone">
            <span className="text-mist">Телефон для связи</span>
            <PhoneField
              id="modal-phone"
              value={phone}
              onChange={setPhone}
              invalid={Boolean(errors.phone)}
              errorId="modal-phone-error"
              autoFocus={!isQuote}
            />
            <FieldError id="modal-phone-error">{errors.phone}</FieldError>
          </label>

          <label className="grid gap-1.5 text-sm" htmlFor="modal-comment">
            <span className="text-mist">Комментарий</span>
            <textarea
              id="modal-comment"
              className="field min-h-24 resize-y"
              value={comment}
              placeholder={isQuote ? "Что уже знаете о детали" : "Марка и что нужно найти"}
              onChange={(event) => setComment(event.target.value)}
            />
          </label>

          {status === "error" ? (
            <p role="alert" className="text-sm text-danger">
              {message} Телефон: {company.phoneDisplay}.
            </p>
          ) : null}

          <p className="text-xs leading-relaxed text-mist">
            Нажимая кнопку, вы соглашаетесь с{" "}
            <button type="button" className="link" onClick={onPrivacy}>
              политикой конфиденциальности
            </button>
            .
          </p>
          <button type="submit" className="btn btn-primary" disabled={status === "sending"}>
            {status === "sending" ? "Отправляем" : isQuote ? "Получить расчёт" : "Жду звонка"}
          </button>
        </form>
      )}
    </Dialog>
  );
}
