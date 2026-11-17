import { splitContentParagraphs } from "@/modules/content/body";

export function ContentBody({ body }: { body: string }) {
  const paragraphs = splitContentParagraphs(body);
  if (paragraphs.length === 0) {
    return null;
  }
  return (
    <div className="grid gap-4 text-base leading-7 text-ink">
      {paragraphs.map((paragraph, index) => (
        <p className="whitespace-pre-wrap" key={index}>
          {paragraph}
        </p>
      ))}
    </div>
  );
}
