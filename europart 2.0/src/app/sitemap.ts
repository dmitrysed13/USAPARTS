import type { MetadataRoute } from "next";
import { connection } from "next/server";
import { getSiteUrl } from "@/lib/env";
import { listIndexableLandingPaths } from "@/modules/seo/landing-data";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  await connection();
  const site = getSiteUrl();
  const paths = await listIndexableLandingPaths();
  return paths.map((path) => ({
    url: `${site}${path}`,
    changeFrequency: "weekly",
    priority: path === "/avtozapchasti" ? 0.8 : 0.6,
  }));
}
