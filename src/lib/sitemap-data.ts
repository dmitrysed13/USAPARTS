import { cacheWrap } from "@/lib/cache";
import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/site";

export type SitemapEntry = { loc: string; lastmod?: string };

const CHUNK = 5000;

export async function productSitemapCount() {
  const total = await prisma.product.count({ where: { isPublished: true, indexable: true } });
  return Math.max(1, Math.ceil(total / CHUNK));
}

export async function productSitemap(page: number): Promise<SitemapEntry[]> {
  const rows = await prisma.product.findMany({
    where: { isPublished: true, indexable: true },
    orderBy: { id: "asc" },
    skip: (page - 1) * CHUNK,
    take: CHUNK,
    select: { slug: true, updatedAt: true, canonicalPath: true },
  });
  return rows.map((row) => ({
    loc: absoluteUrl(row.canonicalPath || `/product/${row.slug}`),
    lastmod: row.updatedAt.toISOString(),
  }));
}

export async function fitmentSitemap(): Promise<SitemapEntry[]> {
  return cacheWrap("sitemap-fitment", 300, async () => {
    const rows = await prisma.product.findMany({
      where: { isPublished: true, indexable: true },
      select: {
        updatedAt: true,
        category: { select: { slug: true, parent: { select: { slug: true } } } },
        compatibilities: {
          select: {
            year: true,
            make: { select: { slug: true } },
            model: { select: { slug: true } },
          },
        },
      },
    });
    const urls = new Map<string, string>();
    const touch = (path: string, lastmod: Date) => {
      const prev = urls.get(path);
      const iso = lastmod.toISOString();
      if (!prev || prev < iso) urls.set(path, iso);
    };
    for (const row of rows) {
      const parent = row.category.parent?.slug;
      const categoryPath = parent ? `/catalog/${parent}/${row.category.slug}` : `/catalog/${row.category.slug}`;
      touch(categoryPath, row.updatedAt);
      if (parent) touch(`/catalog/${parent}`, row.updatedAt);
      for (const fit of row.compatibilities) {
        touch(`/brands/${fit.make.slug}`, row.updatedAt);
        if (fit.model) touch(`/brands/${fit.make.slug}/${fit.model.slug}`, row.updatedAt);
        if (fit.model && fit.year) {
          const yearPath = `/brands/${fit.make.slug}/${fit.model.slug}/${fit.year}`;
          touch(yearPath, row.updatedAt);
          const categorySlug = parent ?? row.category.slug;
          touch(`${yearPath}/${categorySlug}`, row.updatedAt);
        }
      }
    }
    return [...urls.entries()].map(([path, lastmod]) => ({ loc: absoluteUrl(path), lastmod }));
  });
}

export async function contentSitemap(): Promise<SitemapEntry[]> {
  const [articles, landings, pages] = await Promise.all([
    prisma.article.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
    prisma.landingPage.findMany({
      where: { isPublished: true, indexable: true },
      select: { slug: true, updatedAt: true },
    }),
    prisma.page.findMany({ where: { isPublished: true }, select: { slug: true, updatedAt: true } }),
  ]);
  return [
    ...articles.map((row) => ({ loc: absoluteUrl(`/blog/${row.slug}`), lastmod: row.updatedAt.toISOString() })),
    ...landings.map((row) => ({ loc: absoluteUrl(`/${row.slug}`), lastmod: row.updatedAt.toISOString() })),
    ...pages.map((row) => ({ loc: absoluteUrl(`/info/${row.slug}`), lastmod: row.updatedAt.toISOString() })),
  ];
}

export function sitemapXml(entries: SitemapEntry[]) {
  const body = entries
    .map((entry) => {
      const lastmod = entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : "";
      return `<url><loc>${escapeXml(entry.loc)}</loc>${lastmod}</url>`;
    })
    .join("");
  return `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</urlset>`;
}

export function sitemapIndexXml(locs: string[]) {
  const body = locs.map((loc) => `<sitemap><loc>${escapeXml(loc)}</loc></sitemap>`).join("");
  return `<?xml version="1.0" encoding="UTF-8"?><sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${body}</sitemapindex>`;
}

function escapeXml(value: string) {
  return value.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}
