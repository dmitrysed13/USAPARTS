import { applyPhoneEdit, isPhoneEmpty } from "../lib/phone.ts";

type PhoneFieldProps = {
  id: string;
  value: string;
  onChange: (value: string) => void;
  invalid?: boolean;
  errorId?: string;
  autoFocus?: boolean;
};

export function PhoneField({ id, value, onChange, invalid = false, errorId, autoFocus = false }: PhoneFieldProps) {
  return (
    <input
      id={id}
      name="phone"
      className="field"
      inputMode="tel"
      autoComplete="tel"
      placeholder="+7 (999) 123-45-67"
      value={value}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      data-autofocus={autoFocus ? "" : undefined}
      onChange={(event) => onChange(applyPhoneEdit(value, event.target.value))}
      onFocus={() => {
        if (!value) onChange("+7");
      }}
      onBlur={() => {
        if (isPhoneEmpty(value)) onChange("");
      }}
    />
  );
}
