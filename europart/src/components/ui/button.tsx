import type { ButtonHTMLAttributes } from "react";

type ButtonVariant =
  "primary" | "secondary" | "secondary-on-dark" | "ghost" | "ghost-on-dark";

const variants: Record<ButtonVariant, string> = {
  primary: "bg-brand text-white hover:bg-brand-strong",
  secondary: "bg-panel text-panel-foreground hover:bg-panel-muted",
  "secondary-on-dark": "bg-white text-ink hover:bg-surface-muted",
  ghost: "bg-transparent text-ink hover:bg-surface-muted",
  "ghost-on-dark": "bg-transparent text-panel-foreground hover:bg-white/10",
};

export function buttonClassName(
  variant: ButtonVariant = "primary",
  className = "",
): string {
  return [
    "inline-flex h-12 items-center justify-center gap-2 rounded-control px-5 text-sm font-semibold transition",
    "disabled:pointer-events-none disabled:opacity-50",
    variants[variant],
    className,
  ]
    .filter(Boolean)
    .join(" ");
}

export function Button({
  variant = "primary",
  className = "",
  type = "button",
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: ButtonVariant }) {
  return (
    <button className={buttonClassName(variant, className)} type={type} {...props} />
  );
}
