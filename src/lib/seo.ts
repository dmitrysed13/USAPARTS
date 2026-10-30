import { cacheWrap } from "@/lib/cache";
import { prisma } from "@/lib/db";

export function applyTemplate(template: string, vars: Record<string, string | number | null | undefined>) {
  return template.replace(/\{(\w+)\}/g, (_match, key: string) => {
    const value = vars[key];
    return value == null ? "" : String(value);
  }).replace(/\s+/g, " ").trim();
}

export async function getSeoTemplate(key: string) {
  const all = await cacheWrap("seo-templates", 120, async () => {
    const rows = await prisma.seoTemplate.findMany();
    return Object.fromEntries(rows.map((row) => [row.key, { title: row.titleTemplate, description: row.descriptionTemplate }]));
  });
  return all[key] ?? { title: "{name} | USAPARTS", description: "{name}" };
}

export async function seoFromTemplate(
  key: string,
  vars: Record<string, string | number | null | undefined>,
  override?: { title?: string | null; description?: string | null },
) {
  const template = await getSeoTemplate(key);
  return {
    title: override?.title?.trim() || applyTemplate(template.title, vars),
    description: override?.description?.trim() || applyTemplate(template.description, vars),
  };
}
