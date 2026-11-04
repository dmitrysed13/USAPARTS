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
      placeholder="+375 (29) 792-07-86"
      value={value}
      aria-invalid={invalid || undefined}
      aria-describedby={invalid ? errorId : undefined}
      data-autofocus={autoFocus ? "" : undefined}
      onChange={(event) => onChange(applyPhoneEdit(value, event.target.value))}
      onFocus={() => {
        if (!value) onChange("+375");
      }}
      onBlur={() => {
        if (isPhoneEmpty(value)) onChange("");
      }}
    />
  );
}
