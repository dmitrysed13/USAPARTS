import { connection } from "next/server";
import { permanentRedirect } from "next/navigation";

export const instant = false;

/** Spec §8 `/parts/{slug}` alias → canonical `/product/{slug}`. */
export default async function PartsAliasPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  await connection();
  const { slug } = await params;
  permanentRedirect(`/product/${slug}`);
}
