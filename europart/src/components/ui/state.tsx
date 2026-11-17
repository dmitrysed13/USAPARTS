export function EmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-2xl border border-dashed border-line bg-surface-muted px-6 py-10 text-center">
      <h3 className="font-display text-lg font-semibold">{title}</h3>
      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-ink-muted">
        {description}
      </p>
    </div>
  );
}

export function ErrorState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div
      className="rounded-2xl border border-danger/20 bg-brand-soft px-6 py-8"
      role="alert"
    >
      <h3 className="font-display text-lg font-semibold text-brand-strong">{title}</h3>
      <p className="mt-2 max-w-xl text-sm leading-6 text-ink">{description}</p>
    </div>
  );
}
