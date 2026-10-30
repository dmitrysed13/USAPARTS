import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { prisma } from "@/lib/db";

const GONE_HTML = `<!doctype html><html lang="ru"><head><meta charset="utf-8"><title>Страница снята</title><meta name="robots" content="noindex"></head><body style="font-family:sans-serif;background:#f3f5f8;color:#0c2340;padding:48px"><h1>Страница снята</h1><p>Этот адрес больше не обслуживается. Код ответа 410.</p><p><a href="/catalog">Перейти в каталог</a></p></body></html>`;

let goneCache = { exp: 0, paths: new Set<string>() };

async function isGone(pathname: string) {
  if (Date.now() > goneCache.exp) {
    try {
      const rows = await prisma.slugTombstone.findMany({
        where: { httpStatus: 410 },
        select: { path: true },
      });
      goneCache = { exp: Date.now() + 10_000, paths: new Set(rows.map((row) => row.path)) };
    } catch {
      goneCache = { exp: Date.now() + 5_000, paths: goneCache.paths };
    }
  }
  return goneCache.paths.has(pathname);
}

export default auth(async (request) => {
  const { pathname } = request.nextUrl;
  if (await isGone(pathname)) {
    return new NextResponse(GONE_HTML, {
      status: 410,
      headers: {
        "content-type": "text/html; charset=utf-8",
        "x-robots-tag": "noindex",
        "cache-control": "no-store",
      },
    });
  }
  const role = request.auth?.user?.role;
  if (pathname.startsWith("/admin") && role !== "ADMIN" && role !== "MANAGER" && role !== "CONTENT") {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (pathname.startsWith("/account") && !request.auth?.user) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
});

export const config = {
  runtime: "nodejs",
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp|ico)$).*)"],
};
