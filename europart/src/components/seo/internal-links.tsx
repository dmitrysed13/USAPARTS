import Link from "next/link";
import type { InternalLink } from "@/modules/seo/linking";

export function InternalLinks({
  title = "Смотрите также",
  links,
}: {
  title?: string;
  links: InternalLink[];
}) {
  const usable = links.filter((link) => link.kind !== "analog");
  if (usable.length === 0) {
    return null;
  }
  return (
    <section className="grid gap-3">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <ul className="flex flex-wrap gap-x-4 gap-y-2 text-sm">
        {usable.map((link) => (
          <li key={`${link.kind}:${link.href}`}>
            <Link className="font-medium text-brand hover:text-brand-strong" href={link.href}>
              {link.label}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
