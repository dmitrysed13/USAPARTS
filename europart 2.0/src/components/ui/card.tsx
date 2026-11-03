import type { ReactNode } from "react";

export function Card({
  children,
  className = "",
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <article
      className={`rounded-2xl border border-line bg-surface shadow-[var(--shadow-card)] ${className}`}
    >
      {children}
    </article>
  );
}
