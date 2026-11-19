export function JsonLd({ data }: { data: Record<string, unknown> | null }) {
  if (!data) {
    return null;
  }
  return (
    <script
      dangerouslySetInnerHTML={{
        __html: JSON.stringify(data).replace(/</g, "\\u003c"),
      }}
      type="application/ld+json"
    />
  );
}
