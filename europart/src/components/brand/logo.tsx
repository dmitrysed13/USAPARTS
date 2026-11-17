export function Logo({ tone = "dark" }: { tone?: "dark" | "light" }) {
  const text = tone === "light" ? "text-white" : "text-ink";

  return (
    <span
      className={`inline-flex items-center gap-2.5 font-display text-lg font-semibold tracking-tight ${text}`}
    >
      <svg aria-hidden="true" className="size-8" viewBox="0 0 32 32">
        <rect fill="#d0121a" height="32" rx="8" width="32" />
        <circle cx="16" cy="16" fill="none" r="8" stroke="#ffffff" strokeWidth="2" />
        <circle cx="16" cy="16" fill="#ffffff" r="2.5" />
      </svg>
      EUROPART
    </span>
  );
}
