import { ContentBody } from "@/components/content/content-body";

/** Optional editorial block on category / vehicle pages. */
export function CmsSection({
  title,
  body,
}: {
  title: string;
  body: string;
}) {
  return (
    <section className="grid max-w-3xl gap-3">
      <h2 className="font-display text-2xl font-semibold tracking-tight">{title}</h2>
      <ContentBody body={body} />
    </section>
  );
}
