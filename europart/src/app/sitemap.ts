import type { MetadataRoute } from "next";
import { buildSitemapSlice, SITEMAP_IDS, type SitemapId } from "@/modules/seo/sitemap";

export async function generateSitemaps() {
  return SITEMAP_IDS.map((id) => ({ id }));
}

export default async function sitemap(props: {
  id: Promise<string> | string;
}): Promise<MetadataRoute.Sitemap> {
  const raw = await props.id;
  const id = (typeof raw === "string" ? raw : String(raw)) as SitemapId;
  if (!SITEMAP_IDS.includes(id)) {
    return [];
  }
  return buildSitemapSlice(id);
}
