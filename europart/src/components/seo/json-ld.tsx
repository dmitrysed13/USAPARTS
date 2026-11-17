import { jsonLdScript, type JsonLd } from "@/modules/seo/schema";

export function JsonLdScript({ data }: { data: JsonLd | JsonLd[] }) {
  return (
    <script
      dangerouslySetInnerHTML={{ __html: jsonLdScript(data) }}
      type="application/ld+json"
    />
  );
}
