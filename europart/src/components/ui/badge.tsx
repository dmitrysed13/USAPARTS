import type { AvailabilityStatus } from "@/modules/commerce/availability";

const tones: Record<AvailabilityStatus, string> = {
  in_stock: "bg-[#e8f6ee] text-success",
  low_stock: "bg-[#fff6e0] text-warning",
  on_order: "bg-surface-muted text-ink",
  incoming: "bg-brand-soft text-brand-strong",
  out_of_stock: "bg-surface-muted text-ink-muted",
  discontinued: "bg-surface-muted text-ink-muted line-through",
};

export function Badge({
  status,
  children,
}: {
  status: AvailabilityStatus;
  children: string;
}) {
  return (
    <span
      className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${tones[status]}`}
    >
      {children}
    </span>
  );
}
